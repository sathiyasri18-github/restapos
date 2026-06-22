namespace CustomerApi.Application.Common.Interfaces;

public interface IProductImageStorage
{
    Task<string> SaveProductImageAsync(
        int productId,
        Stream content,
        string fileName,
        string contentType,
        CancellationToken ct = default);

    Task DeleteProductImageAsync(string? relativePath, CancellationToken ct = default);
}
