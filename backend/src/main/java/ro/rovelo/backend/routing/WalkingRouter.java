package ro.rovelo.backend.routing;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.json.JsonMapper;

import ro.rovelo.backend.planner.PlannerDtos.Coord;

/**
 * Drumul pe jos, pe străzi, între mai multe puncte, cu OSRM (motorul de rutare din OpenStreetMap).
 * Întâi serverul nostru din Docker (vezi scripts/prepare-routing.sh), apoi cel public al comunității OSM.
 */
@Component
public class WalkingRouter {

    private static final Logger log = LoggerFactory.getLogger(WalkingRouter.class);

    /** Ritm relaxat de plimbare, la fel ca în aplicație (~4.5 km/h). */
    public static final double WALK_M_PER_MIN = 75;

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record OsrmResponse(String code, List<OsrmRoute> routes, List<OsrmWaypoint> waypoints) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record OsrmRoute(double distance, List<OsrmLeg> legs, OsrmGeometry geometry) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record OsrmLeg(double distance) {}

    /** GeoJSON LineString: coordinates = [[lon, lat], ...] */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record OsrmGeometry(List<List<Double>> coordinates) {}

    /** location = [lon, lat], punctul de pe stradă cel mai apropiat de oprire */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record OsrmWaypoint(List<Double> location) {}

    public record Leg(int meters, int walkMinutes) {}

    /** waypoints = unde ajunge drumul lângă fiecare oprire (intrarea dinspre stradă). */
    public record Walk(List<Leg> legs, List<Coord> path, List<Coord> waypoints) {}

    private final List<String> urls;
    private final RestClient http;
    private final JsonMapper json = JsonMapper.builder()
            .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
            .build();

    /** urls = listă separată prin virgulă (application.yml), fiecare până la ".../route/v1/foot". */
    public WalkingRouter(@Value("${rovelo.osrm.urls}") String urls) {
        this.urls = Arrays.stream(urls.split(",")).map(String::trim).filter(u -> !u.isEmpty()).toList();
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(3));
        factory.setReadTimeout(Duration.ofSeconds(15));
        this.http = RestClient.builder()
                .requestFactory(factory)
                .defaultHeader(HttpHeaders.USER_AGENT, "Rovelo/0.1 (student project, UPT Timisoara)")
                .build();
    }

    public Walk walk(List<Coord> points) {
        String coords = points.stream()
                .map(p -> String.format(Locale.ROOT, "%.6f,%.6f", p.longitude(), p.latitude()))
                .collect(Collectors.joining(";"));
        for (String base : urls) {
            String url = base + "/" + coords + "?overview=full&geometries=geojson&steps=false";
            try {
                String body = http.get().uri(url).retrieve().body(String.class);
                OsrmResponse res = json.readValue(body, OsrmResponse.class);
                if (res != null && "Ok".equals(res.code()) && res.routes() != null && !res.routes().isEmpty()) {
                    return toWalk(res);
                }
                log.warn("OSRM {} answered {}", base, res == null ? "nothing" : res.code());
            } catch (RestClientException | JacksonException e) {
                log.warn("OSRM {} failed: {}", base, e.getMessage());
            }
        }
        throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Walking directions are unavailable right now.");
    }

    private static Walk toWalk(OsrmResponse res) {
        OsrmRoute route = res.routes().get(0);
        List<Leg> legs = new ArrayList<>();
        for (OsrmLeg l : route.legs()) {
            int meters = (int) Math.round(l.distance());
            legs.add(new Leg(meters, Math.max(1, (int) Math.round(meters / WALK_M_PER_MIN))));
        }
        List<Coord> path = new ArrayList<>();
        if (route.geometry() != null && route.geometry().coordinates() != null) {
            for (List<Double> c : route.geometry().coordinates()) {
                if (c.size() >= 2) path.add(new Coord(c.get(1), c.get(0)));
            }
        }
        List<Coord> waypoints = new ArrayList<>();
        if (res.waypoints() != null) {
            for (OsrmWaypoint w : res.waypoints()) {
                List<Double> l = w.location();
                if (l != null && l.size() >= 2) waypoints.add(new Coord(l.get(1), l.get(0)));
            }
        }
        return new Walk(legs, path, waypoints);
    }
}
