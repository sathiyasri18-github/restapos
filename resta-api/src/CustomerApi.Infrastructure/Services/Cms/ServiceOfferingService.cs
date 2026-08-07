using CustomerApi.Application.Cms;
using CustomerApi.Domain.Entities.Cms;
using CustomerApi.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CustomerApi.Infrastructure.Services.Cms;

public class ServiceOfferingService(ApplicationDbContext db) : CmsContentServices(db), IServiceOfferingService
{
    public async Task<IReadOnlyList<ServiceDto>> GetPublishedAsync(int? limit = null)
    {
        IQueryable<ServiceOffering> query = Db.ServiceOfferings.AsNoTracking()
            .Where(x => x.IsActive && x.IsPublished)
            .OrderByDescending(x => x.DemandRating)
            .ThenBy(x => x.SortOrder);
        if (limit.HasValue) query = query.Take(limit.Value);
        return await query.Select(x => new ServiceDto(x.Id, x.Title, x.Subtitle, x.Slug, x.CoverImageUrl, x.SortOrder, x.DemandRating, x.IsFeatured, x.IsPublished, x.Images.Count(i => i.IsActive))).ToListAsync();
    }

    public async Task<ServiceDetailDto?> GetBySlugAsync(string slug)
    {
        var service = await Db.ServiceOfferings.AsNoTracking().Include(x => x.Images.Where(i => i.IsActive))
            .FirstOrDefaultAsync(x => x.Slug == slug && x.IsPublished && x.IsActive);
        if (service == null) return null;
        await Db.ServiceOfferings.Where(x => x.Id == service.Id).ExecuteUpdateAsync(s => s.SetProperty(x => x.ViewCount, x => x.ViewCount + 1));
        return MapDetail(service, service.ViewCount + 1);
    }

    public async Task<IReadOnlyList<ServiceDto>> GetAllAsync() =>
        await Db.ServiceOfferings.AsNoTracking().Where(x => x.IsActive).OrderByDescending(x => x.DemandRating).ThenBy(x => x.SortOrder)
            .Select(x => new ServiceDto(x.Id, x.Title, x.Subtitle, x.Slug, x.CoverImageUrl, x.SortOrder, x.DemandRating, x.IsFeatured, x.IsPublished, x.Images.Count(i => i.IsActive))).ToListAsync();

    public async Task<ServiceDetailDto?> GetByIdAsync(int id)
    {
        var service = await Db.ServiceOfferings.AsNoTracking().Include(x => x.Images.Where(i => i.IsActive)).FirstOrDefaultAsync(x => x.Id == id && x.IsActive);
        return service == null ? null : MapDetail(service, service.ViewCount);
    }

    public async Task<ServiceDetailDto?> CreateAsync(CreateServiceRequest request)
    {
        var slug = string.IsNullOrWhiteSpace(request.Slug) ? GenerateSlug(request.Title) : GenerateSlug(request.Slug);
        var service = new ServiceOffering
        {
            Title = request.Title, Subtitle = request.Subtitle, Slug = slug, Content = request.Content,
            CoverImageUrl = request.CoverImageUrl, MetaTitle = request.MetaTitle, MetaDescription = request.MetaDescription,
            MetaKeywords = request.MetaKeywords, SortOrder = request.SortOrder, DemandRating = request.DemandRating,
            IsPublished = request.IsPublished, IsFeatured = request.IsFeatured
        };
        foreach (var img in (request.Images ?? []).OrderBy(x => x.SortOrder))
            service.Images.Add(new ServiceImage { Title = img.Title, ImageUrl = img.ImageUrl, Caption = img.Caption, SortOrder = img.SortOrder });
        Db.ServiceOfferings.Add(service);
        await Db.SaveChangesAsync();
        return await GetByIdAsync(service.Id);
    }

    public async Task<ServiceDetailDto?> UpdateAsync(int id, CreateServiceRequest request)
    {
        var service = await Db.ServiceOfferings.Include(x => x.Images).FirstOrDefaultAsync(x => x.Id == id && x.IsActive);
        if (service == null) return null;
        service.Title = request.Title; service.Subtitle = request.Subtitle;
        service.Slug = string.IsNullOrWhiteSpace(request.Slug) ? GenerateSlug(request.Title) : GenerateSlug(request.Slug);
        service.Content = request.Content; service.CoverImageUrl = request.CoverImageUrl; service.MetaTitle = request.MetaTitle;
        service.MetaDescription = request.MetaDescription; service.MetaKeywords = request.MetaKeywords;
        service.SortOrder = request.SortOrder; service.DemandRating = request.DemandRating;
        service.IsPublished = request.IsPublished; service.IsFeatured = request.IsFeatured; service.UpdatedAt = DateTime.Now;
        Db.ServiceImages.RemoveRange(service.Images); service.Images.Clear();
        foreach (var img in (request.Images ?? []).OrderBy(x => x.SortOrder))
            service.Images.Add(new ServiceImage { Title = img.Title, ImageUrl = img.ImageUrl, Caption = img.Caption, SortOrder = img.SortOrder });
        await Db.SaveChangesAsync();
        return await GetByIdAsync(service.Id);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var service = await Db.ServiceOfferings.FindAsync(id);
        if (service == null) return false;
        service.IsActive = false; await Db.SaveChangesAsync(); return true;
    }

    public async Task<bool> TogglePublishAsync(int id)
    {
        var service = await Db.ServiceOfferings.FindAsync(id);
        if (service == null) return false;
        service.IsPublished = !service.IsPublished; service.UpdatedAt = DateTime.Now; await Db.SaveChangesAsync(); return true;
    }

    private static ServiceDetailDto MapDetail(ServiceOffering service, int viewCount) =>
        new(service.Id, service.Title, service.Subtitle, service.Slug, service.Content, service.CoverImageUrl,
            service.MetaTitle, service.MetaDescription, service.MetaKeywords, service.SortOrder, service.DemandRating,
            service.IsFeatured, service.IsPublished, viewCount,
            service.Images.OrderBy(x => x.SortOrder).Select(x => new ServiceImageDto(x.Id, x.ServiceId, x.Title, x.ImageUrl, x.Caption, x.SortOrder)).ToList());
}
