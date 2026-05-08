export type BuildInfo = {
  version: string;
  buildCommit: string;
};

export const buildInfo: BuildInfo = {
  version: __APP_VERSION__,
  buildCommit: __GIT_COMMIT__
};
