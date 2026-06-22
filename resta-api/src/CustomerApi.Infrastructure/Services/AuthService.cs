using CustomerApi.Application.Auth;
using CustomerApi.Application.Common.Interfaces;
using CustomerApi.Domain.Entities;
using CustomerApi.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CustomerApi.Infrastructure.Services;

public class AuthService(
    UserManager<User> userManager,
    SignInManager<User> signInManager,
    ApplicationDbContext db,
    IJwtTokenService jwtTokenService) : IAuthService
{
    public async Task<AuthResponse> SignInAsync(SignInRequest request, CancellationToken ct = default)
    {
        var user = await userManager.FindByNameAsync(request.UserName);
        if (user is null || user.IsDeleted)
            throw new UnauthorizedAccessException("Invalid username or password.");

        if (!user.IsActive)
            throw new UnauthorizedAccessException("Account is inactive.");

        var signInResult = await signInManager.CheckPasswordSignInAsync(
            user, request.Password, lockoutOnFailure: false);

        if (!signInResult.Succeeded)
            throw new UnauthorizedAccessException("Invalid username or password.");

        await RehashLegacyPasswordIfNeededAsync(user, request.Password);

        return await BuildResponseAsync(user, ct);
    }

    public async Task<AuthResponse> SignUpAsync(SignUpRequest request, CancellationToken ct = default)
    {
        if (request.Password != request.ConfirmPassword)
            throw new ArgumentException("Passwords do not match.");

        if (await userManager.FindByNameAsync(request.UserName) is not null)
            throw new InvalidOperationException($"Username '{request.UserName}' is already taken.");

        if (!string.IsNullOrWhiteSpace(request.Email)
            && await userManager.FindByEmailAsync(request.Email) is not null)
            throw new InvalidOperationException("An account with that email already exists.");

        var defaultRole = await db.Roles
            .Where(r => r.IsActive)
            .OrderBy(r => r.Id)
            .FirstOrDefaultAsync(ct);

        var user = new User
        {
            UserName     = request.UserName,
            Email        = request.Email ?? string.Empty,
            PhoneNumber  = string.Empty,
            RoleId       = defaultRole?.Id ?? 1,
            IsActive     = true,
            IsDeleted    = false,
            CreatedDate  = DateTime.UtcNow,
            ModifiedDate = DateTime.UtcNow,
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            var message = string.Join("; ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException(message);
        }

        return await BuildResponseAsync(user, ct);
    }

    public async Task<ForgotPasswordResponse> ForgotPasswordAsync(
        ForgotPasswordRequest request,
        bool returnToken = false,
        CancellationToken ct = default)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null || user.IsDeleted)
            return new ForgotPasswordResponse("If the email exists, a reset link has been sent.");

        var existing = db.PasswordResets.Where(pr => pr.Email == request.Email);
        db.PasswordResets.RemoveRange(existing);

        var plain = Application.Common.ResetTokenHelper.GeneratePlainToken();
        var hashed = Application.Common.ResetTokenHelper.HashToken(plain);

        db.PasswordResets.Add(new PasswordReset
        {
            Email       = request.Email,
            Token       = hashed,
            CreatedDate = DateTime.UtcNow,
        });

        await db.SaveChangesAsync(ct);

        return new ForgotPasswordResponse(
            "If the email exists, a reset link has been sent.",
            returnToken ? plain : null);
    }

    public async Task<MessageResponse> ResetPasswordAsync(
        ResetPasswordRequest request,
        CancellationToken ct = default)
    {
        if (request.Password != request.ConfirmPassword)
            throw new ArgumentException("Passwords do not match.");

        var hashed = Application.Common.ResetTokenHelper.HashToken(request.Token);
        var record = await db.PasswordResets
            .FirstOrDefaultAsync(pr => pr.Token == hashed, ct)
            ?? throw new InvalidOperationException("Invalid or expired reset token.");

        if (record.CreatedDate.HasValue
            && DateTime.UtcNow > record.CreatedDate.Value.AddHours(1))
        {
            db.PasswordResets.Remove(record);
            await db.SaveChangesAsync(ct);
            throw new InvalidOperationException("Reset token has expired. Please request a new one.");
        }

        var user = await userManager.FindByEmailAsync(record.Email);
        if (user is null || user.IsDeleted)
            throw new InvalidOperationException("User not found.");

        user.PasswordHash = userManager.PasswordHasher.HashPassword(user, request.Password);
        user.ModifiedDate = DateTime.UtcNow;
        var updateResult = await userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            var message = string.Join("; ", updateResult.Errors.Select(e => e.Description));
            throw new InvalidOperationException(message);
        }

        db.PasswordResets.Remove(record);
        await db.SaveChangesAsync(ct);

        return new MessageResponse("Password has been reset successfully.");
    }

    public async Task<MessageResponse> ChangePasswordAsync(
        int userId,
        ChangePasswordRequest request,
        CancellationToken ct = default)
    {
        if (request.NewPassword != request.ConfirmPassword)
            throw new ArgumentException("New passwords do not match.");

        var user = await userManager.FindByIdAsync(userId.ToString())
            ?? throw new InvalidOperationException("User not found.");

        var result = await userManager.ChangePasswordAsync(
            user, request.CurrentPassword, request.NewPassword);

        if (!result.Succeeded)
        {
            var isWrongPassword = result.Errors.Any(e => e.Code.Contains("PasswordMismatch", StringComparison.OrdinalIgnoreCase));
            if (isWrongPassword)
                throw new UnauthorizedAccessException("Current password is incorrect.");

            var message = string.Join("; ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException(message);
        }

        user.ModifiedDate = DateTime.UtcNow;
        await userManager.UpdateAsync(user);

        return new MessageResponse("Password changed successfully.");
    }

    private async Task RehashLegacyPasswordIfNeededAsync(User user, string plainPassword)
    {
        if (user.PasswordHash is null)
            return;

        var verification = userManager.PasswordHasher.VerifyHashedPassword(
            user, user.PasswordHash, plainPassword);

        if (verification != PasswordVerificationResult.SuccessRehashNeeded)
            return;

        user.PasswordHash = userManager.PasswordHasher.HashPassword(user, plainPassword);
        user.ModifiedDate = DateTime.UtcNow;
        await userManager.UpdateAsync(user);
    }

    private async Task<AuthResponse> BuildResponseAsync(User user, CancellationToken ct)
    {
        var roleIds = await db.UserRoles.AsNoTracking()
            .Where(ur => ur.UserId == user.Id)
            .Select(ur => ur.RoleId)
            .ToListAsync(ct);

        if (user.RoleId > 0 && !roleIds.Contains(user.RoleId))
            roleIds.Add(user.RoleId);

        var roleNames = roleIds.Count == 0
            ? []
            : await db.Roles.AsNoTracking()
                .Where(r => roleIds.Contains(r.Id))
                .OrderBy(r => r.Name)
                .Select(r => r.Name ?? string.Empty)
                .ToListAsync(ct);

        var expiresAt = jwtTokenService.GetExpiresAt();
        var token     = jwtTokenService.GenerateToken(user, roleNames);

        var displayName = user.UserName ?? string.Empty;

        var dto = new AuthUserDto(
            UserId:      user.Id,
            UserName:    displayName,
            DisplayName: displayName,
            Email:       string.IsNullOrWhiteSpace(user.Email) ? null : user.Email,
            Roles:       roleNames.AsReadOnly());

        return new AuthResponse(
            AccessToken: token,
            ExpiresAt:   expiresAt.ToString("O"),
            User:        dto);
    }
}
