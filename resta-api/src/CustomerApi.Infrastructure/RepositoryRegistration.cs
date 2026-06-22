using CustomerApi.Application.Common.Interfaces;
using CustomerApi.Infrastructure.Repositories;
using Microsoft.Extensions.DependencyInjection;

namespace CustomerApi.Infrastructure;

public static class RepositoryRegistration
{
    public static IServiceCollection AddGenericRepositories(this IServiceCollection services)
    {
        var entityTypes = AppDomain.CurrentDomain.GetAssemblies()
            .SelectMany(a => a.GetTypes())
            .Where(t => t.Namespace == "CustomerApi.Domain.Entities" && t is { IsClass: true, IsAbstract: false })
            .ToList();

        foreach (var entityType in entityTypes)
        {
            var repoInterface = typeof(IGenericRepository<>).MakeGenericType(entityType);
            var repoImplementation = typeof(GenericRepository<>).MakeGenericType(entityType);
            services.AddScoped(repoInterface, repoImplementation);
        }

        return services;
    }
}
