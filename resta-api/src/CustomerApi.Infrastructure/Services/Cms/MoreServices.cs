using CustomerApi.Application.Cms;
using CustomerApi.Domain.Entities.Cms;
using CustomerApi.Domain.Enums;
using CustomerApi.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace CustomerApi.Infrastructure.Services.Cms;

public class AdvertisementService(ApplicationDbContext db) : IAdvertisementService
{
    public async Task<IReadOnlyList<AdvertisementDto>> GetActiveAsync(AdvertisementPosition? position = null)
    {
        var now = DateTime.Now;
        var query = db.Advertisements.AsNoTracking()
            .Where(x => x.IsActive && x.StartDate <= now && x.EndDate >= now);
        if (position.HasValue) query = query.Where(x => x.Position == position);
        return await query.OrderBy(x => x.SortOrder)
            .Select(x => new AdvertisementDto(x.Id, x.Title, x.ImageUrl, x.LinkUrl, x.Position, x.StartDate, x.EndDate, x.SortOrder))
            .ToListAsync();
    }

    public async Task<IReadOnlyList<AdvertisementDto>> GetAllAsync() =>
        await db.Advertisements.AsNoTracking().Where(x => x.IsActive)
            .Select(x => new AdvertisementDto(x.Id, x.Title, x.ImageUrl, x.LinkUrl, x.Position, x.StartDate, x.EndDate, x.SortOrder))
            .ToListAsync();

    public async Task<Advertisement> CreateAsync(AdvertisementDto dto)
    {
        var ad = new Advertisement
        {
            Title = dto.Title,
            ImageUrl = dto.ImageUrl,
            LinkUrl = dto.LinkUrl,
            Position = dto.Position,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            SortOrder = dto.SortOrder
        };
        db.Advertisements.Add(ad);
        await db.SaveChangesAsync();
        return ad;
    }

    public async Task<Advertisement?> UpdateAsync(int id, AdvertisementDto dto)
    {
        var ad = await db.Advertisements.FindAsync(id);
        if (ad == null) return null;
        ad.Title = dto.Title;
        ad.ImageUrl = dto.ImageUrl;
        ad.LinkUrl = dto.LinkUrl;
        ad.Position = dto.Position;
        ad.StartDate = dto.StartDate;
        ad.EndDate = dto.EndDate;
        ad.SortOrder = dto.SortOrder;
        ad.UpdatedAt = DateTime.Now;
        await db.SaveChangesAsync();
        return ad;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var ad = await db.Advertisements.FindAsync(id);
        if (ad == null) return false;
        ad.IsActive = false;
        await db.SaveChangesAsync();
        return true;
    }
}

public class BannerService(ApplicationDbContext db) : IBannerService
{
    public async Task<IReadOnlyList<BannerSlideDto>> GetActiveAsync() =>
        await db.BannerSlides.AsNoTracking().Where(x => x.IsActive)
            .OrderBy(x => x.SortOrder)
            .Select(x => new BannerSlideDto(x.Id, x.Title, x.Subtitle, x.ImageUrl, x.LinkUrl, x.SortOrder))
            .ToListAsync();

    public async Task<IReadOnlyList<BannerSlideDto>> GetAllAsync() =>
        await db.BannerSlides.AsNoTracking().Where(x => x.IsActive)
            .Select(x => new BannerSlideDto(x.Id, x.Title, x.Subtitle, x.ImageUrl, x.LinkUrl, x.SortOrder))
            .ToListAsync();

    public async Task<BannerSlide> CreateAsync(BannerSlideDto dto)
    {
        var slide = new BannerSlide
        {
            Title = dto.Title,
            Subtitle = dto.Subtitle,
            ImageUrl = dto.ImageUrl,
            LinkUrl = dto.LinkUrl,
            SortOrder = dto.SortOrder
        };
        db.BannerSlides.Add(slide);
        await db.SaveChangesAsync();
        return slide;
    }

    public async Task<BannerSlide?> UpdateAsync(int id, BannerSlideDto dto)
    {
        var slide = await db.BannerSlides.FindAsync(id);
        if (slide == null) return null;
        slide.Title = dto.Title;
        slide.Subtitle = dto.Subtitle;
        slide.ImageUrl = dto.ImageUrl;
        slide.LinkUrl = dto.LinkUrl;
        slide.SortOrder = dto.SortOrder;
        slide.UpdatedAt = DateTime.Now;
        await db.SaveChangesAsync();
        return slide;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var slide = await db.BannerSlides.FindAsync(id);
        if (slide == null) return false;
        slide.IsActive = false;
        await db.SaveChangesAsync();
        return true;
    }
}

public class SiteMenuService(ApplicationDbContext db, IMemoryCache cache) : ISiteMenuService
{
    private const string MenuCacheKey = "cms:site-menu";

    public async Task<IReadOnlyList<MenuItemDto>> GetMenuTreeAsync()
    {
        if (cache.TryGetValue<IReadOnlyList<MenuItemDto>>(MenuCacheKey, out var cachedMenu))
            return cachedMenu;

        var items = await db.SiteMenuItems.AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.SortOrder)
            .ToListAsync();

        var menu = BuildTree(items, null);
        cache.Set(MenuCacheKey, menu, TimeSpan.FromMinutes(15));
        return menu;
    }

    private static List<MenuItemDto> BuildTree(List<SiteMenuItem> items, int? parentId) =>
        items.Where(x => x.ParentId == parentId)
            .Select(x => new MenuItemDto(x.Id, x.Title, x.Url, x.ParentId, x.SortOrder, x.OpenInNewTab, BuildTree(items, x.Id)))
            .ToList();

    public async Task<SiteMenuItem> CreateAsync(MenuItemDto dto)
    {
        var item = new SiteMenuItem
        {
            Title = dto.Title,
            Url = dto.Url,
            ParentId = dto.ParentId,
            SortOrder = dto.SortOrder,
            OpenInNewTab = dto.OpenInNewTab
        };
        db.SiteMenuItems.Add(item);
        await db.SaveChangesAsync();
        cache.Remove(MenuCacheKey);
        return item;
    }

    public async Task<SiteMenuItem?> UpdateAsync(int id, MenuItemDto dto)
    {
        var item = await db.SiteMenuItems.FindAsync(id);
        if (item == null) return null;
        item.Title = dto.Title;
        item.Url = dto.Url;
        item.ParentId = dto.ParentId;
        item.SortOrder = dto.SortOrder;
        item.OpenInNewTab = dto.OpenInNewTab;
        item.UpdatedAt = DateTime.Now;
        await db.SaveChangesAsync();
        cache.Remove(MenuCacheKey);
        return item;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var item = await db.SiteMenuItems.FindAsync(id);
        if (item == null) return false;
        item.IsActive = false;
        await db.SaveChangesAsync();
        cache.Remove(MenuCacheKey);
        return true;
    }
}

public class PageService(ApplicationDbContext db) : IPageService
{
    public async Task<DynamicPageDto?> GetBySlugAsync(string slug) =>
        await db.DynamicPages.AsNoTracking()
            .Where(x => x.Slug == slug && x.IsPublished && x.IsActive)
            .Select(x => new DynamicPageDto(x.Id, x.Title, x.Slug, x.Content, x.MetaDescription, x.IsPublished))
            .FirstOrDefaultAsync();

    public async Task<IReadOnlyList<DynamicPageDto>> GetAllAsync() =>
        await db.DynamicPages.AsNoTracking().Where(x => x.IsActive)
            .Select(x => new DynamicPageDto(x.Id, x.Title, x.Slug, x.Content, x.MetaDescription, x.IsPublished))
            .ToListAsync();

    public async Task<DynamicPage> CreateAsync(DynamicPageDto dto)
    {
        var page = new DynamicPage
        {
            Title = dto.Title,
            Slug = dto.Slug,
            Content = dto.Content,
            MetaDescription = dto.MetaDescription,
            IsPublished = dto.IsPublished
        };
        db.DynamicPages.Add(page);
        await db.SaveChangesAsync();
        return page;
    }

    public async Task<DynamicPage?> UpdateAsync(int id, DynamicPageDto dto)
    {
        var page = await db.DynamicPages.FindAsync(id);
        if (page == null) return null;
        page.Title = dto.Title;
        page.Slug = dto.Slug;
        page.Content = dto.Content;
        page.MetaDescription = dto.MetaDescription;
        page.IsPublished = dto.IsPublished;
        page.UpdatedAt = DateTime.Now;
        await db.SaveChangesAsync();
        return page;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var page = await db.DynamicPages.FindAsync(id);
        if (page == null) return false;
        page.IsActive = false;
        await db.SaveChangesAsync();
        return true;
    }
}

public class ContactService(ApplicationDbContext db) : IContactService
{
    public async Task<ContactInquiry> SubmitAsync(SubmitContactRequest request)
    {
        var inquiry = new ContactInquiry
        {
            Name = request.Name,
            Email = request.Email,
            Phone = request.Phone,
            Subject = request.Subject,
            Message = request.Message
        };
        db.ContactInquiries.Add(inquiry);
        await db.SaveChangesAsync();
        return inquiry;
    }

    public async Task<PagedResult<ContactInquiryDto>> GetAllAsync(int page, int pageSize)
    {
        var total = await db.ContactInquiries.CountAsync(x => x.IsActive);
        var items = await db.ContactInquiries.AsNoTracking().Where(x => x.IsActive)
            .OrderByDescending(x => x.CreatedAt).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(x => new ContactInquiryDto(x.Id, x.Name, x.Email, x.Phone, x.Subject, x.Message, x.IsRead, x.CreatedAt))
            .ToListAsync();
        return new PagedResult<ContactInquiryDto>(items, total, page, pageSize);
    }

    public async Task<bool> MarkAsReadAsync(int id)
    {
        var inquiry = await db.ContactInquiries.FindAsync(id);
        if (inquiry == null) return false;
        inquiry.IsRead = true;
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var inquiry = await db.ContactInquiries.FindAsync(id);
        if (inquiry == null) return false;
        inquiry.IsActive = false;
        await db.SaveChangesAsync();
        return true;
    }
}

public class EventService(ApplicationDbContext db) : IEventService
{
    public async Task<IReadOnlyList<EventDto>> GetPublishedAsync() =>
        await db.Events.AsNoTracking().Where(x => x.IsPublished && x.IsActive)
            .OrderByDescending(x => x.StartDate)
            .Select(x => new EventDto(x.Id, x.Title, x.Description, x.Location, x.StartDate, x.EndDate, x.ImageUrl, x.IsPublished))
            .ToListAsync();

    public async Task<IReadOnlyList<EventDto>> GetAllAsync() =>
        await db.Events.AsNoTracking().Where(x => x.IsActive)
            .Select(x => new EventDto(x.Id, x.Title, x.Description, x.Location, x.StartDate, x.EndDate, x.ImageUrl, x.IsPublished))
            .ToListAsync();

    public async Task<EventItem> CreateAsync(EventDto dto)
    {
        var evt = new EventItem
        {
            Title = dto.Title,
            Description = dto.Description,
            Location = dto.Location,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            ImageUrl = dto.ImageUrl,
            IsPublished = dto.IsPublished
        };
        db.Events.Add(evt);
        await db.SaveChangesAsync();
        return evt;
    }

    public async Task<EventItem?> UpdateAsync(int id, EventDto dto)
    {
        var evt = await db.Events.FindAsync(id);
        if (evt == null) return null;
        evt.Title = dto.Title;
        evt.Description = dto.Description;
        evt.Location = dto.Location;
        evt.StartDate = dto.StartDate;
        evt.EndDate = dto.EndDate;
        evt.ImageUrl = dto.ImageUrl;
        evt.IsPublished = dto.IsPublished;
        evt.UpdatedAt = DateTime.Now;
        await db.SaveChangesAsync();
        return evt;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var evt = await db.Events.FindAsync(id);
        if (evt == null) return false;
        evt.IsActive = false;
        await db.SaveChangesAsync();
        return true;
    }
}

public class VisitorService(ApplicationDbContext db) : IVisitorService
{
    public async Task<VisitorStatsDto> GetStatsAsync()
    {
        var stats = await db.VisitorStats.AsNoTracking().FirstOrDefaultAsync() ?? new VisitorStat();
        return new VisitorStatsDto(stats.TotalVisitors, stats.TotalPageViews);
    }

    public async Task RecordVisitAsync()
    {
        var stats = await db.VisitorStats.FirstOrDefaultAsync();
        if (stats == null)
        {
            stats = new VisitorStat { TotalVisitors = 1, TotalPageViews = 0 };
            db.VisitorStats.Add(stats);
        }
        else
        {
            stats.TotalVisitors++;
            stats.LastUpdated = DateTime.Now;
        }
        await db.SaveChangesAsync();
    }

    public async Task RecordPageViewAsync()
    {
        var stats = await db.VisitorStats.FirstOrDefaultAsync();
        if (stats == null)
        {
            stats = new VisitorStat { TotalVisitors = 0, TotalPageViews = 1 };
            db.VisitorStats.Add(stats);
        }
        else
        {
            stats.TotalPageViews++;
            stats.LastUpdated = DateTime.Now;
        }
        await db.SaveChangesAsync();
    }
}

public class SiteSettingsService(ApplicationDbContext db, IMemoryCache cache) : ISiteSettingsService
{
    private const string SettingsCacheKey = "cms:site-settings";

    public async Task<SiteSettingsDto> GetAsync()
    {
        if (cache.TryGetValue<SiteSettingsDto>(SettingsCacheKey, out var cachedSettings))
            return cachedSettings;

        var settings = await db.SiteSettings.AsNoTracking().ToDictionaryAsync(x => x.Key, x => x.Value);
        var result = new SiteSettingsDto(
            settings.GetValueOrDefault("AssociationName", "Restaurant"),
            settings.GetValueOrDefault("Tagline", "Fresh food, warm hospitality"),
            settings.GetValueOrDefault("Address", string.Empty),
            settings.GetValueOrDefault("Phone", string.Empty),
            settings.GetValueOrDefault("Email", string.Empty),
            settings.GetValueOrDefault("MapEmbedUrl", null),
            settings.GetValueOrDefault("AboutContent", null),
            settings.GetValueOrDefault("Vision", null),
            settings.GetValueOrDefault("Mission", null),
            settings.GetValueOrDefault("Objectives", null)
        );
        cache.Set(SettingsCacheKey, result, TimeSpan.FromMinutes(15));
        return result;
    }

    public async Task UpdateAsync(SiteSettingsDto settings)
    {
        var dict = new Dictionary<string, string?>
        {
            ["AssociationName"] = settings.AssociationName,
            ["Tagline"] = settings.Tagline,
            ["Address"] = settings.Address,
            ["Phone"] = settings.Phone,
            ["Email"] = settings.Email,
            ["MapEmbedUrl"] = settings.MapEmbedUrl,
            ["AboutContent"] = settings.AboutContent,
            ["Vision"] = settings.Vision,
            ["Mission"] = settings.Mission,
            ["Objectives"] = settings.Objectives
        };

        foreach (var (key, value) in dict)
        {
            if (value == null) continue;
            var setting = await db.SiteSettings.FirstOrDefaultAsync(x => x.Key == key);
            if (setting == null)
            {
                db.SiteSettings.Add(new SiteSetting { Key = key, Value = value });
            }
            else
            {
                setting.Value = value;
                setting.UpdatedAt = DateTime.Now;
            }
        }
        await db.SaveChangesAsync();
        cache.Remove(SettingsCacheKey);
    }
}

