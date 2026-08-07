using CustomerApi.Application.Cms;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CustomerApi.API.Controllers.Cms;

[ApiController]
[Route("api/public/services")]
[AllowAnonymous]
public class PublicServicesController(IServiceOfferingService services) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? limit = null)
        => Ok(new ApiResponse<IReadOnlyList<ServiceDto>>(true, await services.GetPublishedAsync(limit)));

    [HttpGet("{slug}")]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        var service = await services.GetBySlugAsync(slug);
        return service == null ? NotFound() : Ok(new ApiResponse<ServiceDetailDto>(true, service));
    }

    [HttpGet("slugs")]
    public async Task<IActionResult> GetSlugs()
    {
        var all = await services.GetPublishedAsync(null);
        return Ok(new ApiResponse<object>(true, all.Select(x => new { x.Slug }).ToList()));
    }
}

[ApiController]
[Route("api/admin/services")]
[Authorize]
public class AdminServicesController(IServiceOfferingService services) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(new ApiResponse<IReadOnlyList<ServiceDto>>(true, await services.GetAllAsync()));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var service = await services.GetByIdAsync(id);
        return service == null ? NotFound() : Ok(new ApiResponse<ServiceDetailDto>(true, service));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateServiceRequest request)
        => Ok(new ApiResponse<ServiceDetailDto>(true, await services.CreateAsync(request)));

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateServiceRequest request)
    {
        var service = await services.UpdateAsync(id, request);
        return service == null ? NotFound() : Ok(new ApiResponse<ServiceDetailDto>(true, service));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
        => Ok(new ApiResponse<bool>(true, await services.DeleteAsync(id)));

    [HttpPatch("{id:int}/publish")]
    public async Task<IActionResult> TogglePublish(int id)
        => Ok(new ApiResponse<bool>(true, await services.TogglePublishAsync(id)));
}
