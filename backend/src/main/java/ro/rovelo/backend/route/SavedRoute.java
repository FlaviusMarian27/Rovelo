package ro.rovelo.backend.route;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import ro.rovelo.backend.user.User;

/**
 * O rută salvată de un utilizator.
 * Ruta (opriri, segmente, linia de pe hartă) se ține ca JSON, exact cum o trimite aplicația:
 * forma ei e încă în schimbare și backend-ul n-are nevoie să o înțeleagă ca să o păstreze.
 */
@Entity
@Table(name = "saved_routes")
public class SavedRoute {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** Când se șterge contul, se șterg și rutele lui (ON DELETE CASCADE în baza de date). */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    @Column(name = "route_json", nullable = false, columnDefinition = "text")
    private String routeJson;

    @Column(name = "saved_at", nullable = false, updatable = false)
    private Instant savedAt = Instant.now();

    protected SavedRoute() {
        // pentru JPA
    }

    public SavedRoute(User user, String routeJson) {
        this.user = user;
        this.routeJson = routeJson;
    }

    public UUID getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getRouteJson() {
        return routeJson;
    }

    public Instant getSavedAt() {
        return savedAt;
    }
}
