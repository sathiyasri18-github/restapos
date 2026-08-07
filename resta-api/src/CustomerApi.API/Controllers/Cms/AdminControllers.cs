using CustomerApi.Application.Cms;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CustomerApi.API.Controllers.Cms;

[ApiController]
[Route("api/admin/news")]
[Authorize]
public class AdminNewsController(INewsService news) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        => Ok(new ApiResponse<PagedResult<NewsDto>>(true, await news.GetAllAsync(page, pageSize)));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var article = await news.GetByIdAsync(id);
        return article == null ? NotFound() : Ok(new ApiResponse<NewsDetailDto>(true, article));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateNewsRequest request)
        => Ok(new ApiResponse<object>(true, await news.CreateAsync(request)));

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateNewsRequest request)
    {
        var article = await news.UpdateAsync(id, request);
        return article == null ? NotFound() : Ok(new ApiResponse<object>(true, article));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
        => Ok(new ApiResponse<bool>(true, await news.DeleteAsync(id)));

    [HttpPatch("{id:int}/publish")]
    public async Task<IActionResult> TogglePublish(int id)
        => Ok(new ApiResponse<bool>(true, await news.TogglePublishAsync(id)));
}

[ApiController]
[Route("api/admin/gallery")]
[Authorize]
public class AdminGalleryController(IGalleryService gallery) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAlbums()
        => Ok(new ApiResponse<IReadOnlyList<GalleryAlbumDto>>(true, await gallery.GetAlbumsAsync()));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetAlbum(int id)
    {
        var album = await gallery.GetAlbumAsync(id);
        if (album == null) return NotFound();
        var images = await gallery.GetImagesAsync(id);
        return Ok(new ApiResponse<object>(true, new { Album = album, Images = images }));
    }

    [HttpPost]
    public async Task<IActionResult> CreateAlbum([FromBody] CreateAlbumRequest request)
        => Ok(new ApiResponse<object>(true, await gallery.CreateAlbumAsync(request)));

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateAlbum(int id, [FromBody] CreateAlbumRequest request)
    {
        var album = await gallery.UpdateAlbumAsync(id, request);
        return album == null ? NotFound() : Ok(new ApiResponse<object>(true, album));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteAlbum(int id)
        => Ok(new ApiResponse<bool>(true, await gallery.DeleteAlbumAsync(id)));

    [HttpPost("{albumId:int}/images")]
    public async Task<IActionResult> AddImage(int albumId, [FromBody] GalleryImageDto dto)
        => Ok(new ApiResponse<object>(true, await gallery.AddImageAsync(albumId, dto.Title, dto.ImageUrl, dto.Caption, dto.SortOrder)));

    [HttpDelete("images/{imageId:int}")]
    public async Task<IActionResult> DeleteImage(int imageId)
        => Ok(new ApiResponse<bool>(true, await gallery.DeleteImageAsync(imageId)));
}

[ApiController]
[Route("api/admin/videos")]
[Authorize]
public class AdminVideosController(IVideoService videos) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(new ApiResponse<IReadOnlyList<VideoDto>>(true, await videos.GetAllAsync()));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateVideoRequest request)
        => Ok(new ApiResponse<object>(true, await videos.CreateAsync(request)));

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateVideoRequest request)
    {
        var video = await videos.UpdateAsync(id, request);
        return video == null ? NotFound() : Ok(new ApiResponse<object>(true, video));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
        => Ok(new ApiResponse<bool>(true, await videos.DeleteAsync(id)));
}

[ApiController]
[Route("api/admin/advertisements")]
[Authorize]
public class AdminAdvertisementsController(IAdvertisementService ads) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(new ApiResponse<IReadOnlyList<AdvertisementDto>>(true, await ads.GetAllAsync()));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AdvertisementDto dto)
        => Ok(new ApiResponse<object>(true, await ads.CreateAsync(dto)));

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] AdvertisementDto dto)
    {
        var ad = await ads.UpdateAsync(id, dto);
        return ad == null ? NotFound() : Ok(new ApiResponse<object>(true, ad));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
        => Ok(new ApiResponse<bool>(true, await ads.DeleteAsync(id)));
}

[ApiController]
[Route("api/admin/banners")]
[Authorize]
public class AdminBannersController(IBannerService banners) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(new ApiResponse<IReadOnlyList<BannerSlideDto>>(true, await banners.GetAllAsync()));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] BannerSlideDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Subtitle) || string.IsNullOrWhiteSpace(dto.ImageUrl))
            return BadRequest(new ApiResponse<object>(false, null, "Title, subtitle, and image are required"));
        return Ok(new ApiResponse<object>(true, await banners.CreateAsync(dto)));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] BannerSlideDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Subtitle) || string.IsNullOrWhiteSpace(dto.ImageUrl))
            return BadRequest(new ApiResponse<object>(false, null, "Title, subtitle, and image are required"));
        var slide = await banners.UpdateAsync(id, dto);
        return slide == null ? NotFound() : Ok(new ApiResponse<object>(true, slide));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
        => Ok(new ApiResponse<bool>(true, await banners.DeleteAsync(id)));
}

[ApiController]
[Route("api/admin/events")]
[Authorize]
public class AdminEventsController(IEventService events) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(new ApiResponse<IReadOnlyList<EventDto>>(true, await events.GetAllAsync()));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] EventDto dto)
        => Ok(new ApiResponse<object>(true, await events.CreateAsync(dto)));

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] EventDto dto)
    {
        var evt = await events.UpdateAsync(id, dto);
        return evt == null ? NotFound() : Ok(new ApiResponse<object>(true, evt));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
        => Ok(new ApiResponse<bool>(true, await events.DeleteAsync(id)));
}

[ApiController]
[Route("api/admin/contact")]
[Authorize]
public class AdminContactController(IContactService contact) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        => Ok(new ApiResponse<PagedResult<ContactInquiryDto>>(true, await contact.GetAllAsync(page, pageSize)));

    [HttpPatch("{id:int}/read")]
    public async Task<IActionResult> MarkRead(int id)
        => Ok(new ApiResponse<bool>(true, await contact.MarkAsReadAsync(id)));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
        => Ok(new ApiResponse<bool>(true, await contact.DeleteAsync(id)));
}

[ApiController]
[Route("api/admin/menu")]
[Authorize]
public class AdminSiteMenuController(ISiteMenuService menu) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(new ApiResponse<IReadOnlyList<MenuItemDto>>(true, await menu.GetMenuTreeAsync()));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] MenuItemDto dto)
        => Ok(new ApiResponse<object>(true, await menu.CreateAsync(dto)));

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] MenuItemDto dto)
    {
        var item = await menu.UpdateAsync(id, dto);
        return item == null ? NotFound() : Ok(new ApiResponse<object>(true, item));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
        => Ok(new ApiResponse<bool>(true, await menu.DeleteAsync(id)));
}

[ApiController]
[Route("api/admin/pages")]
[Authorize]
public class AdminPagesController(IPageService pages) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(new ApiResponse<IReadOnlyList<DynamicPageDto>>(true, await pages.GetAllAsync()));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] DynamicPageDto dto)
        => Ok(new ApiResponse<object>(true, await pages.CreateAsync(dto)));

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] DynamicPageDto dto)
    {
        var page = await pages.UpdateAsync(id, dto);
        return page == null ? NotFound() : Ok(new ApiResponse<object>(true, page));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
        => Ok(new ApiResponse<bool>(true, await pages.DeleteAsync(id)));
}

[ApiController]
[Route("api/admin/settings")]
[Authorize]
public class AdminSettingsController(ISiteSettingsService settings) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
        => Ok(new ApiResponse<SiteSettingsDto>(true, await settings.GetAsync()));

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] SiteSettingsDto dto)
    {
        await settings.UpdateAsync(dto);
        return Ok(new ApiResponse<bool>(true, true));
    }
}



