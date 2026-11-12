package ro.rovelo.backend.user;

import java.util.Locale;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import ro.rovelo.backend.user.UserDtos.UpdateMeRequest;

@Service
public class UserService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    public static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    @Transactional
    public User register(String firstName, String lastName, String email, String rawPassword) {
        String clean = normalizeEmail(email);
        if (users.existsByEmail(clean)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "An account with this email already exists.");
        }
        return users.save(new User(
                firstName.trim(), lastName.trim(), clean, passwordEncoder.encode(rawPassword)));
    }

    /** Același mesaj pentru email inexistent și parolă greșită: nu dezvăluim ce conturi există. */
    @Transactional(readOnly = true)
    public User authenticate(String email, String rawPassword) {
        return users.findByEmail(normalizeEmail(email))
                .filter(u -> passwordEncoder.matches(rawPassword, u.getPasswordHash()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Wrong email or password."));
    }

    @Transactional(readOnly = true)
    public User get(UUID id) {
        return users.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Account not found."));
    }

    @Transactional
    public User update(UUID id, UpdateMeRequest req) {
        User user = get(id);
        String clean = normalizeEmail(req.email());
        if (!clean.equals(user.getEmail()) && users.existsByEmail(clean)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "An account with this email already exists.");
        }
        String nickname = blankToNull(req.nickname());
        if (nickname != null) nickname = nickname.toLowerCase(Locale.ROOT);
        if (nickname != null && !nickname.equals(user.getNickname()) && users.existsByNickname(nickname)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This nickname is already taken.");
        }
        user.setFirstName(req.firstName().trim());
        user.setLastName(req.lastName().trim());
        user.setNickname(nickname);
        user.setBio(blankToNull(req.bio()));
        user.setEmail(clean);
        return user; // salvat automat la finalul tranzacției
    }

    @Transactional
    public User updatePreferences(UUID id, String theme) {
        User user = get(id);
        user.setTheme(theme);
        return user;
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    @Transactional
    public void delete(UUID id) {
        users.deleteById(id);
    }
}
