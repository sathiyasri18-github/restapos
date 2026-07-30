namespace CustomerApi.Application.Auth;

// ── Requests ─────────────────────────────────────────────────────────────────

public record SignInRequest(string UserName, string Password);

public record SignUpRequest(
    string UserName,
    string DisplayName,
    string? Email,
    string Password,
    string ConfirmPassword);

public record ForgotPasswordRequest(string Email);

public record ResetPasswordRequest(
    string Token,
    string Password,
    string ConfirmPassword);

public record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword,
    string ConfirmPassword);

// ── Responses ────────────────────────────────────────────────────────────────

public record AuthUserDto(
    int UserId,
    string UserName,
    string DisplayName,
    string? Email,
    IReadOnlyList<string> Roles);

public record AuthResponse(
    string AccessToken,
    string ExpiresAt,
    AuthUserDto User);

/// <summary>Returned by sign-up when the account awaits SuperAdmin approval (no JWT).</summary>
public record SignUpResponse(string Message, bool PendingApproval);

public record ForgotPasswordResponse(string Message, string? ResetToken = null);

public record MessageResponse(string Message);
