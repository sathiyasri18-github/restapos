using Asp.Versioning;
using CustomerApi.API.Controllers.Base;
using CustomerApi.Application.Common.Interfaces;
using CustomerApi.Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace CustomerApi.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/GeneralSetting")]
public class GeneralSettingController(
    IGenericRepository<GeneralSetting> repository,
    ISiteAssetStorage assetStorage) : CrudControllerBase<GeneralSetting>(repository)
{
    [HttpPost("{id:int}/site-logo")]
    [RequestSizeLimit(2 * 1024 * 1024)]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(GeneralSetting), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UploadSiteLogo(int id, IFormFile file, CancellationToken ct)
    {
        return await UploadAssetAsync(id, file, SiteAssetKind.Logo, isLogo: true, ct);
    }

    [HttpDelete("{id:int}/site-logo")]
    [ProducesResponseType(typeof(GeneralSetting), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteSiteLogo(int id, CancellationToken ct)
    {
        return await DeleteAssetAsync(id, isLogo: true, ct);
    }

    [HttpPost("{id:int}/favicon")]
    [RequestSizeLimit(2 * 1024 * 1024)]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(GeneralSetting), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UploadFavicon(int id, IFormFile file, CancellationToken ct)
    {
        return await UploadAssetAsync(id, file, SiteAssetKind.Favicon, isLogo: false, ct);
    }

    [HttpDelete("{id:int}/favicon")]
    [ProducesResponseType(typeof(GeneralSetting), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteFavicon(int id, CancellationToken ct)
    {
        return await DeleteAssetAsync(id, isLogo: false, ct);
    }

    private async Task<IActionResult> UploadAssetAsync(
        int id,
        IFormFile file,
        SiteAssetKind kind,
        bool isLogo,
        CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "Image file is required." });

        var entity = await repository.GetByIdAsync(id, ct);
        if (entity is null)
            return NotFound();

        try
        {
            var currentPath = isLogo ? entity.SiteLogo : entity.Favicon;
            await assetStorage.DeleteSiteAssetAsync(currentPath, ct);

            await using var stream = file.OpenReadStream();
            var savedPath = await assetStorage.SaveSiteAssetAsync(
                kind,
                stream,
                file.FileName,
                file.ContentType,
                ct);

            if (isLogo)
                entity.SiteLogo = savedPath;
            else
                entity.Favicon = savedPath;

            entity.ModifiedDate = DateTime.UtcNow;
            var updated = await repository.UpdateAsync(entity, ct);
            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private async Task<IActionResult> DeleteAssetAsync(int id, bool isLogo, CancellationToken ct)
    {
        var entity = await repository.GetByIdAsync(id, ct);
        if (entity is null)
            return NotFound();

        var currentPath = isLogo ? entity.SiteLogo : entity.Favicon;
        await assetStorage.DeleteSiteAssetAsync(currentPath, ct);

        if (isLogo)
            entity.SiteLogo = null;
        else
            entity.Favicon = null;

        entity.ModifiedDate = DateTime.UtcNow;
        var updated = await repository.UpdateAsync(entity, ct);
        return Ok(updated);
    }
}
