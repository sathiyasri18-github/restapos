using CustomerApi.Application.Common;
using CustomerApi.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace CustomerApi.Infrastructure.Identity;

/// <summary>
/// Supports ASP.NET Core Identity hashes, legacy PBKDF2, and Laravel bcrypt seed passwords.
/// </summary>
public class LegacyPasswordHasher : PasswordHasher<User>
{
    public override PasswordVerificationResult VerifyHashedPassword(
        User user,
        string hashedPassword,
        string providedPassword)
    {
        if (string.IsNullOrWhiteSpace(hashedPassword))
            return PasswordVerificationResult.Failed;

        if (hashedPassword.StartsWith("$2y$", StringComparison.Ordinal)
            || hashedPassword.StartsWith("$2a$", StringComparison.Ordinal)
            || hashedPassword.StartsWith("$2b$", StringComparison.Ordinal))
        {
            var bcryptHash = hashedPassword.StartsWith("$2y$", StringComparison.Ordinal)
                ? "$2a$" + hashedPassword[4..]
                : hashedPassword;

            return BCrypt.Net.BCrypt.Verify(providedPassword, bcryptHash)
                ? PasswordVerificationResult.SuccessRehashNeeded
                : PasswordVerificationResult.Failed;
        }

        if (PasswordHasher.Verify(providedPassword, hashedPassword))
            return PasswordVerificationResult.SuccessRehashNeeded;

        return base.VerifyHashedPassword(user, hashedPassword, providedPassword);
    }
}
