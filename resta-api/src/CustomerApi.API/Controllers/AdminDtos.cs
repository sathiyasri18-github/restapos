using CustomerApi.Domain.Entities;

namespace CustomerApi.API.Controllers;

public record UserDto(
    int UserId,
    string UserName,
    string DisplayName,
    string? Email,
    bool IsActive,
    DateTime? LastLoginDate,
    IReadOnlyList<int> RoleIds,
    IReadOnlyList<string> RoleNames);

public record CreateUserRequest(
    string UserName,
    string DisplayName,
    string? Email,
    string Password,
    bool IsActive,
    int? CreatedBy,
    IReadOnlyList<int>? RoleIds);

public record UpdateUserRequest(
    int UserId,
    string UserName,
    string DisplayName,
    string? Email,
    string? Password,
    bool IsActive,
    int? ModifiedBy,
    IReadOnlyList<int>? RoleIds);

public record RoleDto(
    int RoleId,
    string RoleName,
    string? Description,
    bool IsActive);

public record CreateRoleRequest(
    string RoleName,
    string? Description,
    bool IsActive,
    int? CreatedBy);

public record UpdateRoleRequest(
    int RoleId,
    string RoleName,
    string? Description,
    bool IsActive,
    int? ModifiedBy);

public record RoleMenuPermissionDto(
    int MenuId,
    string MenuCode,
    string MenuName,
    bool CanView,
    bool CanAdd,
    bool CanEdit,
    bool CanDelete);

public record SetRoleMenusRequest(
    IReadOnlyList<RoleMenuItemRequest> Menus,
    int? ModifiedBy);

public record RoleMenuItemRequest(
    int MenuId,
    bool CanView,
    bool CanAdd,
    bool CanEdit,
    bool CanDelete);

public record UserRoleDto(
    int UserId,
    string UserName,
    string DisplayName,
    int RoleId,
    string RoleName);

public record AssignUserRolesRequest(
    int UserId,
    IReadOnlyList<int> RoleIds,
    int? ModifiedBy);

public record RoleMenuEntryDto(
    int Id,
    int RoleId,
    string RoleName,
    int MenuId,
    string MenuCode,
    string MenuName,
    bool CanView,
    bool CanAdd,
    bool CanEdit,
    bool CanDelete);

public record CreateRoleMenuRequest(
    int RoleId,
    int MenuId,
    bool CanView,
    bool CanAdd,
    bool CanEdit,
    bool CanDelete,
    int? CreatedBy);

public record UpdateRoleMenuRequest(
    int Id,
    int RoleId,
    int MenuId,
    bool CanView,
    bool CanAdd,
    bool CanEdit,
    bool CanDelete,
    int? ModifiedBy);

public record MenuTreeItemDto(
    int Id,
    int? ParentMenuId,
    string MenuCode,
    string MenuName,
    string? RoutePath,
    string? Icon,
    int SortOrder,
    IReadOnlyList<MenuTreeItemDto> Children);

public static class AdminMapper
{
    public static string DisplayName(User user) =>
        string.IsNullOrWhiteSpace(user.CompanyName) ? user.UserName ?? string.Empty : user.CompanyName!;

    public static UserDto ToUserDto(User user, IReadOnlyList<int> roleIds, IReadOnlyList<string> roleNames) =>
        new(user.Id, user.UserName ?? string.Empty, DisplayName(user),
            string.IsNullOrWhiteSpace(user.Email) ? null : user.Email,
            user.IsActive, null, roleIds, roleNames);

    public static RoleDto ToRoleDto(Role role) =>
        new(role.Id, role.Name ?? string.Empty, role.Description, role.IsActive);
}
