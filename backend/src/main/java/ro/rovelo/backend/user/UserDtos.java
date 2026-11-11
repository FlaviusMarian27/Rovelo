package ro.rovelo.backend.user;

import java.util.UUID;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Ce primește și ce trimite API-ul despre utilizatori (fără hash-ul parolei). */
public final class UserDtos {

    private UserDtos() {}

    public record UserResponse(UUID id, String name, String email) {
        public static UserResponse from(User u) {
            return new UserResponse(u.getId(), u.getName(), u.getEmail());
        }
    }

    public record UpdateMeRequest(
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Email @Size(max = 254) String email) {}
}
