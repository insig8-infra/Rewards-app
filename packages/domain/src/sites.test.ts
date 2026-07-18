import assert from "node:assert/strict";
import test from "node:test";
import { DomainError } from "./types.js";
import { normalizeSiteProfile } from "./sites.js";

test("normalizeSiteProfile trims and collapses free-text site fields", () => {
  const site = normalizeSiteProfile({
    clientName: "  Shinde   Residence  ",
    flatOrApartmentNo: "  A-402  ",
    buildingName: "  Sai   Heights ",
    area: "  Baner   Road ",
    city: " Pune ",
  });

  assert.deepEqual(site, {
    clientName: "Shinde Residence",
    flatOrApartmentNo: "A-402",
    buildingName: "Sai Heights",
    area: "Baner Road",
    city: "Pune",
  });
});

test("normalizeSiteProfile omits blank optional fields", () => {
  const site = normalizeSiteProfile({
    clientName: "Patil Flat",
    flatOrApartmentNo: " ",
    buildingName: "",
  });

  assert.deepEqual(site, {
    clientName: "Patil Flat",
  });
});

test("normalizeSiteProfile rejects missing or oversized fields", () => {
  assert.throws(
    () => normalizeSiteProfile({ clientName: "   " }),
    (error) => error instanceof DomainError && error.code === "SITE_CLIENT_NAME_INVALID",
  );

  assert.throws(
    () => normalizeSiteProfile({ clientName: "Valid", city: "x".repeat(121) }),
    (error) => error instanceof DomainError && error.code === "SITE_FIELD_TOO_LONG",
  );
});
