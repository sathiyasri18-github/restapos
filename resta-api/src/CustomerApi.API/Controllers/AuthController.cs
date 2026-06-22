using Asp.Versioning;
using CustomerApi.Application.Auth;
using CustomerApi.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CustomerApi.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
public class AuthController(IAuthService authService, ICurrentUserService currentUser) : ControllerBase
{
    /// <summary>Sign in with username and password, returns a JWT.</summary>
    [HttpPost("sign-in")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> SignIn([FromBody] SignInRequest request, CancellationToken ct)
    {
        var response = await authService.SignInAsync(request, ct);
        return Ok(response);
    }

    /// <summary>Register a new user account.</summary>
    [HttpPost("sign-up")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SignUp([FromBody] SignUpRequest request, CancellationToken ct)
    {
        var response = await authService.SignUpAsync(request, ct);
        return StatusCode(StatusCodes.Status201Created, response);
    }

    /// <summary>Request a password-reset token for the given email.</summary>
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ForgotPasswordResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ForgotPassword(
        [FromBody] ForgotPasswordRequest request,
        CancellationToken ct)
    {
        // Return the plain token only in development so the frontend can test
        // without a mail server configured.
        var isDev = HttpContext.RequestServices
            .GetRequiredService<IWebHostEnvironment>().IsDevelopment();

        var response = await authService.ForgotPasswordAsync(request, returnToken: isDev, ct);
        return Ok(response);
    }

    /// <summary>Reset password using the token from the forgot-password flow.</summary>
    [HttpPost("reset-password")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request, CancellationToken ct)
    {
        var response = await authService.ResetPasswordAsync(request, ct);
        return Ok(response);
    }

    /// <summary>Change the current user's password (requires a valid JWT).</summary>
    [HttpPost("change-password")]
    [Authorize]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ChangePassword(
        [FromBody] ChangePasswordRequest request,
        CancellationToken ct)
    {
        if (currentUser.UserId is not int userId)
            return Unauthorized();

        var response = await authService.ChangePasswordAsync(userId, request, ct);
        return Ok(response);
    }
}
