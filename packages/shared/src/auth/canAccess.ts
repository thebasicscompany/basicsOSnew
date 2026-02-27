// FIXME: This should be exported from the ra-core package
type CanAccessParams<
  RecordType extends Record<string, unknown> = Record<string, unknown>,
> = {
  action: string;
  resource: string;
  record?: RecordType;
};

export const canAccess = <
  RecordType extends Record<string, unknown> = Record<string, unknown>,
>(
  role: string,
  params: CanAccessParams<RecordType>,
): boolean => {
  if (role === "admin") {
    return true;
  }

  if (params.resource === "sales") {
    return false;
  }

  if (params.resource === "configuration") {
    return false;
  }

  return true;
};
