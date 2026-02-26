import { describe, expect, it } from "vitest";
import { cidrSchema } from "../api-key";

describe("cidrSchema Test", () => {
  describe("valid CIDRs", () => {
    it.each([
      "192.168.1.0/8",
      "192.168.1.0/16",
      "192.168.1.0/24",
      "192.168.1.0/32",
      "10.0.0.0/10",
      "172.16.0.0/12",
      "10.0.0.0/9",
      "192.168.0.0/22",
      "10.0.0.0/27",
      "0.0.0.0/8",
      "255.255.255.255/32"
    ])("should accept %s", (cidr) => {
      expect(cidrSchema.safeParse(cidr).success).toBe(true);
    });
  });

  describe("invalid CIDRs", () => {
    it.each([
      { cidr: "192.168.1.0/7", description: "subnet below 8" },
      { cidr: "192.168.1.0/33", description: "subnet above 32" },
      { cidr: "192.168.1.0/0", description: "subnet equal to 0" },
      { cidr: "192.168.1.0/-1", description: "negative subnet" },
      { cidr: "192.168.1.0/", description: "missing subnet value" },
      { cidr: "192.168.1.0", description: "missing subnet entirely" },
      { cidr: "999.168.1.0/24", description: "invalid IP address" },
      { cidr: "not-an-ip/24", description: "non-IP string" },
      { cidr: "/24", description: "missing IP" },
      { cidr: "", description: "empty string" },
      { cidr: 123, description: "non-string value" },
      {
        cidr: "255.255.255.255/32a",
        description: "subnet with non-numeric characters"
      }
    ])("should reject $cidr ($description)", ({ cidr }) => {
      expect(cidrSchema.safeParse(cidr).success).toBe(false);
    });
  });
});
