export type BuildInfo = {
  version: string;
  buildCommit: string;
};

export const buildInfo: BuildInfo = {
  version: typeof __APP_VERSION__ === "undefined" ? "0.1.0" : __APP_VERSION__,
  buildCommit: typeof __GIT_COMMIT__ === "undefined" ? "test" : __GIT_COMMIT__
};
