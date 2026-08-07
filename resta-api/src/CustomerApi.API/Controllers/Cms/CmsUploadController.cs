using CustomerApi.Application.Cms;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CustomerApi.API.Controllers.Cms;

[ApiController]
[Route("api/admin/upload")]
[Authorize]
public class CmsUploadController(ICmsFileStorageService storage) : ControllerBase
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf", ".doc", ".docx"
    };

    private const long MaxFileSize = 10 * 1024 * 1024; // 10 MB

    [HttpPost("{folder}")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaxFileSize)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxFileSize)]
    public async Task<IActionResult> Upload(string folder, CancellationToken ct)
    {
        var file = Request.Form.Files.GetFile("file")
                   ?? Request.Form.Files.FirstOrDefault();

        if (file == null || file.Length == 0)
            return BadRequest(new ApiResponse<string>(false, null, "No file uploaded"));

        if (file.Length > MaxFileSize)
            return BadRequest(new ApiResponse<string>(false, null, "File exceeds 10 MB limit"));

        var extension = Path.GetExtension(file.FileName);
        if (string.IsNullOrEmpty(extension) || !AllowedExtensions.Contains(extension))
            return BadRequest(new ApiResponse<string>(false, null, $"File type '{extension}' is not allowed"));

        var safeFolder = string.Join("", folder.Where(char.IsLetterOrDigit));
        if (string.IsNullOrEmpty(safeFolder))
            return BadRequest(new ApiResponse<string>(false, null, "Invalid folder name"));

        await using var stream = file.OpenReadStream();
        var path = await storage.SaveFileAsync(stream, file.FileName, safeFolder);
        return Ok(new ApiResponse<string>(true, path, "File uploaded successfully"));
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromQuery] string path)
    {
        if (string.IsNullOrWhiteSpace(path))
            return BadRequest(new ApiResponse<bool>(false, false, "Path is required"));

        var deleted = await storage.DeleteFileAsync(path);
        return deleted
            ? Ok(new ApiResponse<bool>(true, true, "File deleted"))
            : NotFound(new ApiResponse<bool>(false, false, "File not found"));
    }
}
