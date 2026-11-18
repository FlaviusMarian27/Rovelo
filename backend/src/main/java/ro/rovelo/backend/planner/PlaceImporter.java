package ro.rovelo.backend.planner;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.json.JsonMapper;

/**
 * Importă locurile dintr-un export OpenStreetMap în tabela `places`.
 * Se rulează o dată (sau când vrei date noi), cu fișierul făcut de osmium (vezi backend/README.md):
 *   mvn spring-boot:run -Dspring-boot.run.arguments=--import-places=/cale/pois.geojsonseq
 * Fără argument nu face nimic. Rulat din nou, actualizează locurile existente.
 */
@Component
public class PlaceImporter implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(PlaceImporter.class);
    private static final int BATCH = 1000;

    private static final String UPSERT = """
            INSERT INTO places (id, name, search_name, kind, lat, lon, base_score, wikidata, wikipedia)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name, search_name = EXCLUDED.search_name, kind = EXCLUDED.kind,
              lat = EXCLUDED.lat, lon = EXCLUDED.lon,
              base_score = EXCLUDED.base_score, wikidata = EXCLUDED.wikidata, wikipedia = EXCLUDED.wikipedia
            """;

    /** O linie din fișier = un obiect GeoJSON (Feature). */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Feature(Object id, Geometry geometry, Map<String, Object> properties) {}

    /** coordinates = [lon, lat] la punct, liste de liste la linii / poligoane. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Geometry(String type, Object coordinates) {}

    private final JdbcTemplate jdbc;
    private final JsonMapper json = JsonMapper.builder()
            .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
            .build();

    public PlaceImporter(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) throws IOException {
        if (!args.containsOption("import-places")) return;
        Path file = Path.of(args.getOptionValues("import-places").get(0));
        log.info("Importing places from {}…", file);

        int read = 0, kept = 0;
        List<Object[]> batch = new ArrayList<>();
        try (BufferedReader in = Files.newBufferedReader(file, StandardCharsets.UTF_8)) {
            String line;
            while ((line = in.readLine()) != null) {
                // geojsonseq poate avea caracterul RS (0x1E) la începutul fiecărei linii
                line = line.replace("\u001e", "").trim();
                if (line.isEmpty()) continue;
                read++;
                Object[] row = toRow(line);
                if (row == null) continue;
                batch.add(row);
                kept++;
                if (batch.size() == BATCH) {
                    jdbc.batchUpdate(UPSERT, batch);
                    batch.clear();
                    log.info("  {} places so far", kept);
                }
            }
        }
        if (!batch.isEmpty()) jdbc.batchUpdate(UPSERT, batch);
        log.info("Import done: {} features read, {} places kept.", read, kept);
    }

    /** null = nu ne interesează (fără nume, tip necunoscut, fără coordonate). */
    private Object[] toRow(String line) {
        Feature f;
        try {
            f = json.readValue(line, Feature.class);
        } catch (JacksonException e) {
            return null;
        }
        if (f == null || f.properties() == null || f.geometry() == null) return null;

        Map<String, String> tags = new HashMap<>();
        f.properties().forEach((k, v) -> {
            if (v != null) tags.put(k, v.toString());
        });
        String name = tags.get("name");
        PoiKind kind = PoiKind.classify(tags);
        double[] center = centroid(f.geometry().coordinates());
        if (name == null || name.isBlank() || kind == null || center == null) return null;

        String id = osmId(f.id(), tags, center);
        return new Object[] {
            id, truncate(name, 200), truncate(PlannerService.normalize(name), 200), kind.id(), center[1], center[0],
            PlannerService.baseScore(tags, kind),
            truncate(tags.get("wikidata"), 20), truncate(tags.get("wikipedia"), 200),
        };
    }

    /**
     * osmium --add-unique-id=type_id dă "n123" / "w456" / "r789" → "osm:node/123" etc.
     * Poligoanele (clădiri, parcuri) vin ca "a…": id-ul de area al lui osmium e
     * 2 × id-ul way-ului, sau 2 × id-ul relației + 1.
     */
    private static String osmId(Object rawId, Map<String, String> tags, double[] center) {
        String raw = rawId == null ? "" : rawId.toString();
        if (raw.length() > 1 && raw.substring(1).chars().allMatch(Character::isDigit)) {
            long n = Long.parseLong(raw.substring(1));
            return switch (raw.charAt(0)) {
                case 'n' -> "osm:node/" + n;
                case 'w' -> "osm:way/" + n;
                case 'r' -> "osm:relation/" + n;
                case 'a' -> n % 2 == 0 ? "osm:way/" + n / 2 : "osm:relation/" + (n - 1) / 2;
                default -> "osm:" + raw;
            };
        }
        // Fără id (export fără --add-unique-id): ceva stabil din nume + poziție
        return truncate("osm:" + Integer.toHexString((tags.get("name") + center[0] + center[1]).hashCode()), 40);
    }

    /** Media tuturor punctelor geometriei: [lon, lat]. Destul de bună pentru o clădire sau un parc. */
    static double[] centroid(Object coordinates) {
        double[] sum = new double[3]; // lon, lat, câte puncte
        collect(coordinates, sum);
        return sum[2] == 0 ? null : new double[] {sum[0] / sum[2], sum[1] / sum[2]};
    }

    private static void collect(Object node, double[] sum) {
        if (!(node instanceof List<?> list) || list.isEmpty()) return;
        if (list.get(0) instanceof Number lon && list.size() >= 2 && list.get(1) instanceof Number lat) {
            sum[0] += lon.doubleValue();
            sum[1] += lat.doubleValue();
            sum[2]++;
            return;
        }
        for (Object child : list) collect(child, sum);
    }

    private static String truncate(String s, int max) {
        return s == null ? null : s.length() > max ? s.substring(0, max) : s;
    }
}
