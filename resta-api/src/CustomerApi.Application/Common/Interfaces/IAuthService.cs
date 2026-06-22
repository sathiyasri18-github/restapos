using CustomerApi.Application.Auth;

namespace CustomerApi.Application.Common.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> SignInAsync(SignInRequest request, CancellationToken ct = default);
    Task<AuthResponse> SignUpAsync(SignUpRequest request, CancellationToken ct = default);

    Task<ForgotPasswordResponse> ForgotPasswordAsync(
        ForgotPasswordRequest request,
        bool returnToken = false,
        CancellationToken ct = default);

    Task<MessageResponse> ResetPasswordAsync(ResetPasswordRequest request, CancellationToken ct = default);

    Task<MessageResponse> ChangePasswordAsync(
        int userId,
        ChangePasswordRequest request,
        CancellationToken ct = default);
}
