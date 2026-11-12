package ro.rovelo.backend.user;

import java.util.UUID;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Ce primește și ce trimite API-ul despre utilizatori (fără hash-ul parolei). */
public final class UserDtos {

    private UserDtos() {}

    /** 3–30 caractere: litere, cifre, punct și underscore. */
    public static final String NICKNAME_PATTERN = "^[A-Za-z0-9._]{3,30}$";

    public record UserResponse(
            UUID id,
            String firstName,
            String lastName,
            String nickname,
            String bio,
            String email,
            String theme) {
        public static UserResponse from(User u) {
            return new UserResponse(
                    u.getId(),
                    u.getFirstName(),
                    u.getLastName(),
                    u.getNickname(),
                    u.getBio(),
                    u.getEmail(),
                    u.getTheme());
        }
    }

    /** nickname și bio sunt opționale: null sau gol = șterse. */
    public record UpdateMeRequest(
            @NotBlank @Size(max = 50) String firstName,
            @NotBlank @Size(max = 50) String lastName,
            @Pattern(regexp = "^$|" + NICKNAME_PATTERN) String nickname,
            @Size(max = 160) String bio,
            @NotBlank @Email @Size(max = 254) String email) {}

    public record PreferencesRequest(@NotBlank @Pattern(regexp = "system|light|dark") String theme) {}
}
