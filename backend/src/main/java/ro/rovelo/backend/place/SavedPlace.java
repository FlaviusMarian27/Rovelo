package ro.rovelo.backend.place;

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
import jakarta.persistence.UniqueConstraint;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import ro.rovelo.backend.user.User;

/**
 * Un loc salvat (din Place story). `placeKey` = id-ul locului din aplicație
 * (acum ex. "catedrala", mai târziu id-ul din OpenStreetMap). Un loc se salvează o singură dată per user.
 * Locul (nume, coordonate, poveste) se ține ca JSON, exact cum îl trimite aplicația.
 */
@Entity
@Table(
        name = "saved_places",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "place_key"}))
public class SavedPlace {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    @Column(name = "place_key", nullable = false, length = 100)
    private String placeKey;

    @Column(name = "place_json", nullable = false, columnDefinition = "text")
    private String placeJson;

    @Column(name = "saved_at", nullable = false)
    private Instant savedAt = Instant.now();

    protected SavedPlace() {
        // pentru JPA
    }

    public SavedPlace(User user, String placeKey, String placeJson) {
        this.user = user;
        this.placeKey = placeKey;
        this.placeJson = placeJson;
    }

    public String getPlaceKey() {
        return placeKey;
    }

    public String getPlaceJson() {
        return placeJson;
    }

    public void setPlaceJson(String placeJson) {
        this.placeJson = placeJson;
    }

    public Instant getSavedAt() {
        return savedAt;
    }
}
