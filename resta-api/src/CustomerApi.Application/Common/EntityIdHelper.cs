using System.Reflection;

namespace CustomerApi.Application.Common;

public static class EntityIdHelper
{
    public static PropertyInfo? GetIdProperty(Type entityType) =>
        entityType.GetProperty("Id", BindingFlags.Public | BindingFlags.Instance);

    public static bool HasIntegerId(Type entityType)
    {
        var prop = GetIdProperty(entityType);
        return prop is not null && (prop.PropertyType == typeof(int) || prop.PropertyType == typeof(long));
    }

    public static int GetIdValue(object entity)
    {
        var prop = GetIdProperty(entity.GetType())
            ?? throw new InvalidOperationException($"Entity {entity.GetType().Name} has no Id property.");
        return Convert.ToInt32(prop.GetValue(entity));
    }

    public static void SetIdValue(object entity, int id)
    {
        var prop = GetIdProperty(entity.GetType())
            ?? throw new InvalidOperationException($"Entity {entity.GetType().Name} has no Id property.");
        prop.SetValue(entity, Convert.ChangeType(id, prop.PropertyType));
    }
}
