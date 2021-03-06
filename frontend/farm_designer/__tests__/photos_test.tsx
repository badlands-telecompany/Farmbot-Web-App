let mockDestroyAllPromise: Promise<void | never> =
  Promise.reject("error").catch(() => { });
jest.mock("../../api/crud", () => ({
  destroyAll: jest.fn(() => mockDestroyAllPromise)
}));

import * as React from "react";
import { mount, shallow } from "enzyme";
import {
  RawDesignerPhotos as DesignerPhotos,
  DesignerPhotosProps,
  mapStateToProps,
  ClearFarmwareData,
} from "../photos";
import { fakeTimeSettings } from "../../__test_support__/fake_time_settings";
import { fakeState } from "../../__test_support__/fake_state";
import { ExpandableHeader } from "../../ui";
import { destroyAll } from "../../api/crud";
import { success, error } from "../../toast/toast";
import { fakeFarmwareManifestV1 } from "../../__test_support__/fake_farmwares";
import { fakeWebAppConfig } from "../../__test_support__/fake_state/resources";
import { buildResourceIndex } from "../../__test_support__/resource_index_builder";

describe("<DesignerPhotos />", () => {
  const fakeProps = (): DesignerPhotosProps => ({
    dispatch: jest.fn(),
    shouldDisplay: () => false,
    timeSettings: fakeTimeSettings(),
    env: {},
    wDEnv: {},
    images: [],
    currentImage: undefined,
    botToMqttStatus: "up",
    syncStatus: undefined,
    saveFarmwareEnv: jest.fn(),
    imageJobs: [],
    versions: {},
    imageFilterBegin: undefined,
    imageFilterEnd: undefined,
    hiddenImages: [],
  });

  it("renders photos panel", () => {
    const wrapper = mount(<DesignerPhotos {...fakeProps()} />);
    ["photos", "camera calibration", "weed detection"].map(string =>
      expect(wrapper.text().toLowerCase()).toContain(string));
  });

  it("shows version", () => {
    const p = fakeProps();
    p.versions = { "take-photo": "1.0.0" };
    const wrapper = mount(<DesignerPhotos {...p} />);
    expect(wrapper.text()).toContain("1.0.0");
  });

  it("expands sections", () => {
    const wrapper = shallow<DesignerPhotos>(<DesignerPhotos {...fakeProps()} />);
    expect(wrapper.state()).toEqual({
      calibration: false, detection: false, manage: false
    });
    const headers = wrapper.find(ExpandableHeader);
    headers.at(0).simulate("click");
    expect(wrapper.state().calibration).toEqual(true);
    headers.at(1).simulate("click");
    expect(wrapper.state().detection).toEqual(true);
    headers.at(2).simulate("click");
    expect(wrapper.state().manage).toEqual(true);
  });
});

describe("mapStateToProps()", () => {
  it("returns props", () => {
    const state = fakeState();
    state.bot.hardware.process_info.farmwares = {
      "My Fake Farmware": fakeFarmwareManifestV1(),
    };
    const props = mapStateToProps(state);
    expect(props.images.length).toEqual(2);
    expect(props.versions).toEqual({ "My Fake Farmware": "0.0.0" });
  });

  it("returns set image filter settings", () => {
    const state = fakeState();
    const webAppConfig = fakeWebAppConfig();
    webAppConfig.body.photo_filter_begin = "2017-09-03T20:01:40.336Z";
    webAppConfig.body.photo_filter_end = "2017-09-27T14:00:47.326Z";
    state.resources = buildResourceIndex([webAppConfig]);
    expect(mapStateToProps(state).imageFilterBegin)
      .toEqual("2017-09-03T20:01:40.336Z");
    expect(mapStateToProps(state).imageFilterEnd)
      .toEqual("2017-09-27T14:00:47.326Z");
  });

  it("returns unset image filter settings", () => {
    const state = fakeState();
    const webAppConfig = fakeWebAppConfig();
    webAppConfig.body.photo_filter_begin = "";
    webAppConfig.body.photo_filter_end = "";
    state.resources = buildResourceIndex([webAppConfig]);
    expect(mapStateToProps(state).imageFilterBegin).toEqual(undefined);
    expect(mapStateToProps(state).imageFilterEnd).toEqual(undefined);
  });
});

describe("<ClearFarmwareData />", () => {
  it("destroys all FarmwareEnvs", async () => {
    mockDestroyAllPromise = Promise.resolve();
    const wrapper = mount(<ClearFarmwareData />);
    wrapper.find("button").last().simulate("click");
    await expect(destroyAll).toHaveBeenCalledWith("FarmwareEnv");
    expect(success).toHaveBeenCalledWith(expect.stringContaining("deleted"));
  });

  it("fails to destroy all FarmwareEnvs", async () => {
    mockDestroyAllPromise = Promise.reject("error");
    const wrapper = mount(<ClearFarmwareData />);
    await wrapper.find("button").last().simulate("click");
    await expect(destroyAll).toHaveBeenCalledWith("FarmwareEnv");
    expect(error).toHaveBeenCalled();
  });
});
