using CustomerApi.Application.Common.Interfaces;
using CustomerApi.Application.Cms;
using CustomerApi.Infrastructure.Persistence;
using CustomerApi.Infrastructure.Repositories;
using CustomerApi.Infrastructure.Services.Cms;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CustomerApi.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<ApplicationDbContext>((sp, options) =>
        {
            var configuration = sp.GetRequiredService<IConfiguration>();
            var connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException(
                    "Connection string 'DefaultConnection' is not configured.");

            options.UseSqlServer(
                connectionString,
                b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName));
        });

        services.AddGenericRepositories();
        services.AddAppIdentity();
        services.AddMemoryCache();
        services.AddScoped<IJwtTokenService, Services.JwtTokenService>();
        services.AddScoped<IProductImageStorage, Services.ProductImageStorage>();
        services.AddScoped<ISiteAssetStorage, Services.SiteAssetStorage>();

        services.AddScoped<ICmsFileStorageService, CmsFileStorageService>();
        services.AddScoped<INewsService, NewsService>();
        services.AddScoped<IGalleryService, GalleryService>();
        services.AddScoped<IVideoService, VideoService>();
        services.AddScoped<IAdvertisementService, AdvertisementService>();
        services.AddScoped<IBannerService, BannerService>();
        services.AddScoped<ISiteMenuService, SiteMenuService>();
        services.AddScoped<IPageService, PageService>();
        services.AddScoped<IContactService, ContactService>();
        services.AddScoped<IEventService, EventService>();
        services.AddScoped<IServiceOfferingService, ServiceOfferingService>();
        services.AddScoped<IVisitorService, VisitorService>();
        services.AddScoped<ISiteSettingsService, SiteSettingsService>();

        return services;
    }
}




