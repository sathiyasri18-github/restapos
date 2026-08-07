using CustomerApi.Application.Cms;
using CustomerApi.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CustomerApi.API.Controllers.Cms;

[ApiController]
[Route("api/public")]
[AllowAnonymous]
public class HomeController(
    IBannerService banners,
    INewsService news,
    IAdvertisementService ads,
    IEventService events,
    ISiteSettingsService settings,
    IVisitorService visitors,
    IServiceOfferingService offerings) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetHomeData()
    {
        await visitors.RecordVisitAsync();
        return Ok(new ApiResponse<object>(true, new
        {
            Banners = await banners.GetActiveAsync(),
            FeaturedNews = (await news.GetPublishedAsync(1, 6)).Items,
            Advertisements = await ads.GetActiveAsync(),
            UpcomingEvents = (await events.GetPublishedAsync()).Take(3),
            Settings = await settings.GetAsync(),
            VisitorStats = await visitors.GetStatsAsync(),
            Services = await offerings.GetPublishedAsync(10)
        }));
    }

    [HttpPost("pageview")]
    public async Task<IActionResult> RecordPageView()
    {
        await visitors.RecordPageViewAsync();
        return Ok();
    }
}

[ApiController]
[Route("api/public/news")]
[AllowAnonymous]
public class PublicNewsController(INewsService news) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] NewsCategory? category = null)
        => Ok(new ApiResponse<PagedResult<NewsDto>>(true, await news.GetPublishedAsync(page, pageSize, category)));

    [HttpGet("{slug}")]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        var article = await news.GetBySlugAsync(slug);
        return article == null ? NotFound() : Ok(new ApiResponse<NewsDetailDto>(true, article));
    }

    [HttpGet("slugs")]
    public async Task<IActionResult> GetSlugs()
    {
        var all = await news.GetPublishedAsync(1, 1000);
        var slugs = all.Items.Select(x => new { x.Slug }).ToList();
        return Ok(new ApiResponse<object>(true, slugs));
    }
}

[ApiController]
[Route("api/public/gallery")]
[AllowAnonymous]
public class PublicGalleryController(IGalleryService gallery) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAlbums()
        => Ok(new ApiResponse<IReadOnlyList<GalleryAlbumDto>>(true, await gallery.GetAlbumsAsync()));

    [HttpGet("slideshow")]
    public async Task<IActionResult> GetSlideshow()
        => Ok(new ApiResponse<IReadOnlyList<GalleryImageDto>>(true, await gallery.GetSlideshowImagesAsync()));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetAlbum(int id)
    {
        var album = await gallery.GetAlbumAsync(id);
        if (album == null) return NotFound();
        var images = await gallery.GetImagesAsync(id);
        return Ok(new ApiResponse<object>(true, new { Album = album, Images = images }));
    }
}

[ApiController]
[Route("api/public/videos")]
[AllowAnonymous]
public class PublicVideosController(IVideoService videos) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(new ApiResponse<IReadOnlyList<VideoDto>>(true, await videos.GetPublishedAsync()));
}

[ApiController]
[Route("api/public/about")]
[AllowAnonymous]
public class PublicAboutController(ISiteSettingsService settings) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
        => Ok(new ApiResponse<SiteSettingsDto>(true, await settings.GetAsync()));
}

[ApiController]
[Route("api/public/contact")]
[AllowAnonymous]
public class PublicContactController(IContactService contact, ISiteSettingsService settings) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetInfo()
        => Ok(new ApiResponse<SiteSettingsDto>(true, await settings.GetAsync()));

    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] SubmitContactRequest request)
    {
        var inquiry = await contact.SubmitAsync(request);
        return Ok(new ApiResponse<object>(true, new { inquiry.Id }, "Thank you for your inquiry. We will respond shortly."));
    }
}

[ApiController]
[Route("api/public/menu")]
[AllowAnonymous]
public class PublicSiteMenuController(ISiteMenuService menu) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
        => Ok(new ApiResponse<IReadOnlyList<MenuItemDto>>(true, await menu.GetMenuTreeAsync()));
}

[ApiController]
[Route("api/public/events")]
[AllowAnonymous]
public class PublicEventsController(IEventService events) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(new ApiResponse<IReadOnlyList<EventDto>>(true, await events.GetPublishedAsync()));
}

[ApiController]
[Route("api/public/pages/{slug}")]
[AllowAnonymous]
public class PublicPagesController(IPageService pages) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(string slug)
    {
        var page = await pages.GetBySlugAsync(slug);
        return page == null ? NotFound() : Ok(new ApiResponse<DynamicPageDto>(true, page));
    }
}




