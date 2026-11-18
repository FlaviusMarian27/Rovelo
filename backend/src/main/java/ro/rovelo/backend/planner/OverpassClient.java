package ro.rovelo.backend.planner;

import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.json.JsonMapper;

/**
 * Caută locuri în OpenStreetMap prin Overpass API (gratuit, fără cheie).
 * Serverele publice sunt uneori aglomerate, așa că încercăm pe rând câteva oglinzi.
 * Regula lor: un User-Agent care spune cine suntem și fără cereri în buclă.
 */
@Component
public class OverpassClient {

    private static final Logger log = LoggerFactory.getLogger(OverpassClient.class);

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Response(List<Element> elements) {}

    /** Un nod are lat/lon; un "way" sau o "relation" vin cu "center" (din `out center`). */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Element(String type, long id, Double lat, Double lon, Center center, Map<String, String> tags) {
        Double latitude() {
            return lat != null ? lat : center != null ? center.lat() : null;
        }

        Double longitude() {
            return lon != null ? lon : center != null ? center.lon() : null;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Center(double lat, double lon) {}

    private final List<String> urls;
    private final RestClient http;
    // Citim răspunsul ca text și îl parsăm noi: unele oglinzi trimit JSON cu
    // Content-Type "application/octet-stream", pe care RestClient nu-l parsează singur.
    private final JsonMapper json = JsonMapper.builder()
            .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
            .build();

    /** Același cartier + aceleași interese în ultimele minute → nu mai întrebăm serverul. */
    private static final Duration CACHE_TTL = Duration.ofMinutes(15);
    private record Cached(Instant at, List<Element> elements) {}
    private final Map<String, Cached> cache = new ConcurrentHashMap<>();

    /** urls = listă separată prin virgulă (application.yml). */
    public OverpassClient(@Value("${rovelo.overpass.urls}") String urls) {
        this.urls = Arrays.stream(urls.split(",")).map(String::trim).filter(u -> !u.isEmpty()).toList();
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(8));
        factory.setReadTimeout(Duration.ofSeconds(25));
        this.http = RestClient.builder()
                .requestFactory(factory)
                .defaultHeader(HttpHeaders.USER_AGENT, "Rovelo/0.1 (student project, UPT Timisoara)")
                .build();
    }

    public List<Element> query(String overpassQl) {
        Cached hit = cache.get(overpassQl);
        if (hit != null && hit.at().plus(CACHE_TTL).isAfter(Instant.now())) return hit.elements();

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("data", overpassQl);
        for (String url : urls) {
            try {
                String body = http.post()
                        .uri(url)
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .accept(MediaType.APPLICATION_JSON)
                        .body(form)
                        .retrieve()
                        .body(String.class);
                Response res = json.readValue(body, Response.class);
                if (res != null && res.elements() != null) {
                    cache.put(overpassQl, new Cached(Instant.now(), res.elements()));
                    return res.elements();
                }
            } catch (RestClientException | JacksonException e) {
                // 429 = serverul e plin; trecem la următoarea oglindă
                log.warn("Overpass {} failed: {}", url, shorten(e.getMessage()));
            }
        }
        throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY, "The map service is busy. Try again in a moment.");
    }

    private static String shorten(String s) {
        return s == null ? "" : s.length() > 160 ? s.substring(0, 160) + "…" : s;
    }
}
