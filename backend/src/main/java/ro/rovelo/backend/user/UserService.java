package ro.rovelo.backend.user;

import java.util.Locale;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
    public User register(String name, String email, String rawPassword) {
        String clean = normalizeEmail(email);
        if (users.existsByEmail(clean)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "An account with this email already exists.");
        }
        return users.save(new User(name.trim(), clean, passwordEncoder.encode(rawPassword)));
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
    public User update(UUID id, String name, String email) {
        User user = get(id);
        String clean = normalizeEmail(email);
        if (!clean.equals(user.getEmail()) && users.existsByEmail(clean)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "An account with this email already exists.");
        }
        user.setName(name.trim());
        user.setEmail(clean);
        return user; // salvat automat la finalul tranzacției
    }

    @Transactional
    public void delete(UUID id) {
        users.deleteById(id);
    }
}
