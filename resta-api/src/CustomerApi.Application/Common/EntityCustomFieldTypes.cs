namespace CustomerApi.Application.Common;

public static class EntityCustomFieldTypes
{
    public static readonly string[] EntityCategoryTypeCodes = ["CUSTOM_FIELD_ENTITY", "ENTITY_TYPE"];

    public static readonly IReadOnlyDictionary<string, string[]> EntityNameAliases = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
    {
        ["customer"] = ["Customer", "CUSTOMER"],
        ["product"]  = ["Product", "PRODUCT"],
        ["supplier"] = ["Supplier", "SUPPLIER"],
    };

    public static bool TryNormalize(string entityType, out string normalized)
    {
        normalized = entityType.Trim().ToLowerInvariant();
        return EntityNameAliases.ContainsKey(normalized);
    }
}
