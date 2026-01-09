import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import DBModel from "./model";
let resp = new Response();

beforeEach(() => {
  // Ensure AJV validators are compiled before each test so the model's type guards work
  DBModel.initialize();
  vi.restoreAllMocks();
  resp = new Response();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DBModel roles and permissions endpoints", () => {
  it("fetchRoles returns [] when response.statusCode === 404", async () => {
    resp.json = async () => ({ statusCode: 404 });
    vi.spyOn(global, "fetch").mockResolvedValueOnce(resp );

    const res = await DBModel.fetchRoles();
    expect(res).toEqual([]);
  });

  it("fetchRoles throws when response shape is invalid", async () => {
    resp.json = async () => ({});
    vi.spyOn(global, "fetch").mockResolvedValueOnce(resp);

    await expect(DBModel.fetchRoles()).rejects.toThrow("Invalid response");
  });

  it("fetchRoles returns responseObject when valid", async () => {
    const role = { role_id: "r1", name: "admin", disabled: false, description: null };
    resp.json = async () => ({ message: "ok", responseObject: [role], statusCode: 200, success: true });
    vi.spyOn(global, "fetch").mockResolvedValueOnce(resp );

    const res = await DBModel.fetchRoles();
    expect(res).toEqual([role]);
  });

  it("createRole POSTs and returns the created role", async () => {
    const role = { role_id: "r2", name: "tester", disabled: false, description: null } ;
    resp.json = async () => ({ message: "ok", responseObject: role, statusCode: 200, success: true });
    const spy = vi.spyOn(global, "fetch").mockResolvedValueOnce(resp );

    const created = await DBModel.createRole(role);
    expect(created).toEqual(role);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("/roles"), expect.objectContaining({
      method: "POST",
      body: JSON.stringify(role),
    }));
  });

  it("updateRole PATCHes to the correct URL and returns the updated role", async () => {
    const role = { role_id: "r3", name: "patched", disabled: true, description: null } ;
    resp.json = async () => ({ message: "ok", responseObject: role, statusCode: 200, success: true });
    const spy = vi.spyOn(global, "fetch").mockResolvedValueOnce(resp );

    const updated = await DBModel.updateRole(role);
    expect(updated).toEqual(role);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining(`/roles/${role.role_id}`), expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify(role),
    }));
  });

  it("deleteRole calls DELETE and resolves on success", async () => {
    resp.json = async () => ({ message: "ok", responseObject: {}, statusCode: 200, success: true });
    const spy = vi.spyOn(global, "fetch").mockResolvedValueOnce(resp );

    await expect(DBModel.deleteRole("r4")).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("/roles/r4"), expect.objectContaining({
      method: "DELETE",
    }));
  });

  it("fetchPermissions returns data when valid", async () => {
    const perm = { permission_id: 1, name: "do-stuff", description: null };
    resp.json = async () => ({ message: "ok", responseObject: [perm], statusCode: 200, success: true });
    vi.spyOn(global, "fetch").mockResolvedValueOnce(resp );

    const res = await DBModel.fetchPermissions();
    expect(res).toEqual([perm]);
  });

  it("createPermission POSTS and returns created permission", async () => {
    const permission = { permission_id: 2, name: "perm", description: "", id: -1 } ;
    resp.json = async () => ({ message: "ok", responseObject: permission, statusCode: 200, success: true });
    const spy = vi.spyOn(global, "fetch").mockResolvedValueOnce(resp );

    const created = await DBModel.createPermission(permission);
    expect(created).toEqual(permission);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("/permissions"), expect.objectContaining({
      method: "POST",
      body: JSON.stringify(permission),
    }));
  });

  it("deletePermission calls DELETE and resolves on success", async () => {
    resp.json = async () => ({ message: "ok", responseObject: {}, statusCode: 200, success: true });
    const spy = vi.spyOn(global, "fetch").mockResolvedValueOnce(resp );

    await expect(DBModel.deletePermission("5")).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("/permissions/5"), expect.objectContaining({
      method: "DELETE",
    }));
  });
});
