import { beforeEach, describe, expect, it, vi } from "vitest";

// The store builds its sessionStorage-backed persistence at import time; node has none.
vi.hoisted(() => {
  Object.assign(globalThis, {
    sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  });
});
vi.mock("@/lib/api", () => ({ recordVisit: vi.fn().mockResolvedValue({}) }));

import { recordVisit } from "@/lib/api";
import { registerScrollReader, useBrowser } from "./browser";

const st = () => useBrowser.getState();
const session = () => st().sessions[st().userId as string];
const values = () => session().entries.map((e) => e.value);
const current = () => session().entries[session().index];

beforeEach(() => {
  useBrowser.setState({ userId: "u1", sessions: {}, historyVersion: 0 });
  registerScrollReader(() => null);
  vi.mocked(recordVisit).mockClear();
});

describe("history stack", () => {
  it("builds a trail and records how each page was reached", () => {
    st().navigate("a.zz", "typed");
    st().navigate("b.zz", "link");
    st().navigate("c.zz", "link");

    expect(values()).toEqual(["a.zz", "b.zz", "c.zz"]);
    expect(session().index).toBe(2);
    expect(recordVisit).toHaveBeenNthCalledWith(1, "u1", "a.zz", "typed");
    expect(recordVisit).toHaveBeenNthCalledWith(3, "u1", "c.zz", "link");
  });

  it("back and forward move the index without losing anything", () => {
    ["a.zz", "b.zz", "c.zz"].forEach((a) => st().navigate(a, "link"));

    st().back();
    st().back();
    expect(current().value).toBe("a.zz");
    st().forward();
    expect(current().value).toBe("b.zz");
    expect(values()).toEqual(["a.zz", "b.zz", "c.zz"]);
    expect(recordVisit).toHaveBeenCalledWith("u1", "a.zz", "back");
    expect(recordVisit).toHaveBeenLastCalledWith("u1", "b.zz", "forward");
  });

  it("does nothing at either end of the stack", () => {
    st().navigate("a.zz", "typed");
    st().back();
    st().forward();
    expect(session().index).toBe(0);
    expect(recordVisit).toHaveBeenCalledTimes(1);
  });

  it("loses forward history when you navigate after going back", () => {
    ["a.zz", "b.zz", "c.zz"].forEach((a) => st().navigate(a, "link"));
    st().back(); // at b, with c ahead
    st().navigate("d.zz", "link");

    expect(values()).toEqual(["a.zz", "b.zz", "d.zz"]);
    st().forward();
    expect(current().value).toBe("d.zz"); // c is gone for good
  });

  it("treats navigating to the page you are already on as a no-op", () => {
    st().navigate("a.zz", "typed");
    st().navigate("a.zz", "typed");
    expect(values()).toEqual(["a.zz"]);
    expect(recordVisit).toHaveBeenCalledTimes(1);
  });

  it("replaces the current entry when you re-publish the page you are on", () => {
    st().navigate("a.zz", "typed");
    const before = current().key;
    st().navigate("a.zz", "publish");

    expect(values()).toEqual(["a.zz"]);
    expect(current().key).not.toBe(before); // new key forces the viewer to reload
    expect(recordVisit).toHaveBeenLastCalledWith("u1", "a.zz", "publish");
  });
});

describe("restore on return", () => {
  it("remembers where you were when you left, and gives it back on return", () => {
    registerScrollReader(() => 480);
    st().navigate("a.zz", "typed");
    st().navigate("b.zz", "link"); // leaving a.zz at 480
    registerScrollReader(() => 0);
    st().back(); // leaving b.zz at 0

    expect(current().value).toBe("a.zz");
    expect(current().scrollY).toBe(480);
    expect(session().entries[1].scrollY).toBe(0);
  });

  it("never overwrites a saved position with a page that had not finished loading", () => {
    registerScrollReader(() => 300);
    st().navigate("a.zz", "typed");
    st().navigate("b.zz", "link"); // a.zz saved at 300

    registerScrollReader(() => null); // b.zz still loading: the reader refuses to answer
    st().back();
    st().forward();
    st().back();

    expect(current().value).toBe("a.zz");
    expect(current().scrollY).toBe(300);
  });
});

describe("search as a place in the stack", () => {
  it("lets Back return to the results, and records no visit for the search itself", () => {
    st().navigate("a.zz", "typed");
    st().search("tides");
    st().navigate("b.zz", "search");
    expect(recordVisit).toHaveBeenCalledTimes(2); // a.zz and b.zz only

    st().back();
    expect(current()).toMatchObject({ kind: "search", value: "tides" });
    st().back();
    expect(current().value).toBe("a.zz");
    st().forward();
    expect(current().kind).toBe("search");
  });
});

describe("people", () => {
  it("keeps a separate stack per person", () => {
    st().navigate("a.zz", "typed");
    st().selectUser("u2");
    expect(st().sessions["u2"]).toBeUndefined(); // u2 starts blank
    st().navigate("x.zz", "typed");

    st().selectUser("u1");
    expect(current().value).toBe("a.zz");
    expect(recordVisit).toHaveBeenLastCalledWith("u2", "x.zz", "typed");
  });

  it("does nothing until someone is picked", () => {
    st().selectUser(null);
    st().navigate("a.zz", "typed");
    expect(recordVisit).not.toHaveBeenCalled();
  });
});