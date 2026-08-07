namespace CustomerApi.Application.Cms;

public interface IServiceOfferingService
{
    Task<IReadOnlyList<ServiceDto>> GetPublishedAsync(int? limit = null);
    Task<ServiceDetailDto?> GetBySlugAsync(string slug);
    Task<IReadOnlyList<ServiceDto>> GetAllAsync();
    Task<ServiceDetailDto?> GetByIdAsync(int id);
    Task<ServiceDetailDto?> CreateAsync(CreateServiceRequest request);
    Task<ServiceDetailDto?> UpdateAsync(int id, CreateServiceRequest request);
    Task<bool> DeleteAsync(int id);
    Task<bool> TogglePublishAsync(int id);
}