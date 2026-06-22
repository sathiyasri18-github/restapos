using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using CustomerApi.Application.Common.Interfaces;

namespace CustomerApi.API.Services;

public class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    private ClaimsPrincipal? User => httpContextAccessor.HttpContext?.User;

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated == true;

    public int? UserId
    {
        get
        {
            var id = User?.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User?.FindFirstValue(JwtRegisteredClaimNames.Sub);
            return int.TryParse(id, out var userId) ? userId : null;
        }
    }

    public string? UserName =>
        User?.FindFirstValue(ClaimTypes.Name)
        ?? User?.FindFirstValue(JwtRegisteredClaimNames.UniqueName);
}
