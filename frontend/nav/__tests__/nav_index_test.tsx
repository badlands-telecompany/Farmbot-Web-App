jest.mock("../../devices/timezones/guess_timezone", () => ({
  maybeSetTimezone: jest.fn()
}));

jest.mock("../../session", () => ({ Session: { clear: jest.fn() } }));

import * as React from "react";
import { shallow, mount } from "enzyme";
import { NavBar } from "../index";
import { bot } from "../../__test_support__/fake_state/bot";
import { taggedUser } from "../../__test_support__/user";
import { NavBarProps } from "../interfaces";
import { fakeDevice } from "../../__test_support__/resource_index_builder";
import { maybeSetTimezone } from "../../devices/timezones/guess_timezone";
import { fakeTimeSettings } from "../../__test_support__/fake_time_settings";
import { fakePings } from "../../__test_support__/fake_state/pings";
import { Link } from "../../link";
import { Session } from "../../session";

describe("NavBar", () => {
  const fakeProps = (): NavBarProps => ({
    timeSettings: fakeTimeSettings(),
    consistent: true,
    logs: [],
    bot,
    user: taggedUser,
    dispatch: jest.fn(),
    getConfigValue: jest.fn(),
    tour: undefined,
    device: fakeDevice(),
    autoSync: false,
    alertCount: 0,
    pings: fakePings()
  });

  it("has correct parent classname", () => {
    const wrapper = shallow(<NavBar {...fakeProps()} />);
    expect(wrapper.find("div").first().hasClass("nav-wrapper")).toBeTruthy();
  });

  it("closes nav menu", () => {
    const wrapper = mount<NavBar>(<NavBar {...fakeProps()} />);
    const link = wrapper.find(Link).first();
    link.simulate("click");
    expect(wrapper.instance().state.mobileMenuOpen).toBeFalsy();
    link.simulate("click");
    expect(wrapper.instance().state.mobileMenuOpen).toBeFalsy();
  });

  it("silently sets user timezone as needed", () => {
    const p = fakeProps();
    p.device = fakeDevice({ timezone: undefined });
    const wrapper = mount(<NavBar {...p} />);
    wrapper.mount();
    expect(maybeSetTimezone).toHaveBeenCalledWith(p.dispatch, p.device);
  });

  it("logs out", () => {
    const wrapper = mount<NavBar>(<NavBar {...fakeProps()} />);
    wrapper.instance().logout();
    expect(Session.clear).toHaveBeenCalled();
  });

  it("toggles state value", () => {
    const wrapper = shallow<NavBar>(<NavBar {...fakeProps()} />);
    expect(wrapper.state().mobileMenuOpen).toEqual(false);
    wrapper.instance().toggle("mobileMenuOpen")();
    expect(wrapper.state().mobileMenuOpen).toEqual(true);
  });
});
