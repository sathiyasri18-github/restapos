using CustomerApi.Application.Common.Interfaces;
using CustomerApi.Domain.Entities;
using CustomerApi.Infrastructure.Identity;
using CustomerApi.Infrastructure.Persistence;
using CustomerApi.Infrastructure.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace CustomerApi.Infrastructure;

public static class IdentityServiceExtensions
{
    public static IServiceCollection AddAppIdentity(this IServiceCollection services)
    {
        services.AddIdentityCore<User>(options =>
            {
                options.User.RequireUniqueEmail = false;
                options.SignIn.RequireConfirmedAccount = false;
                options.Password.RequiredLength = 4;
                options.Password.RequireDigit = false;
                options.Password.RequireLowercase = false;
                options.Password.RequireUppercase = false;
                options.Password.RequireNonAlphanumeric = false;
            })
            .AddRoles<Role>()
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddSignInManager()
            .AddDefaultTokenProviders();

        services.AddScoped<IPasswordHasher<User>, LegacyPasswordHasher>();
        services.AddScoped<IAuthService, AuthService>();

        return services;
    }
}
