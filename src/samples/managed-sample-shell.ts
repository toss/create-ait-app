export interface SampleShellMarkerPair {
  end: string;
  start: string;
}

export const SAMPLE_IMPORT_MARKERS: SampleShellMarkerPair = {
  start: "// create-ait-app:sample-imports:start",
  end: "// create-ait-app:sample-imports:end",
};

export const SAMPLE_ROUTE_MARKERS: SampleShellMarkerPair = {
  start: "// create-ait-app:sample-routes:start",
  end: "// create-ait-app:sample-routes:end",
};

export const REACT_SAMPLE_BUTTON_MARKERS: SampleShellMarkerPair = {
  start: "{/* create-ait-app:sample-buttons:start */}",
  end: "{/* create-ait-app:sample-buttons:end */}",
};

export const VANILLA_SAMPLE_BUTTON_MARKERS: SampleShellMarkerPair = {
  start: "<!-- create-ait-app:sample-buttons:start -->",
  end: "<!-- create-ait-app:sample-buttons:end -->",
};

function replaceMarkedBlock(
  content: string,
  nextContent: string,
  markers: SampleShellMarkerPair,
): string {
  const currentStart = content.indexOf(markers.start);
  const currentEnd = content.indexOf(markers.end, currentStart + markers.start.length);
  const nextStart = nextContent.indexOf(markers.start);
  const nextEnd = nextContent.indexOf(markers.end, nextStart + markers.start.length);

  if (currentStart === -1 || currentEnd === -1 || nextStart === -1 || nextEnd === -1) {
    throw new Error(
      "예제 코드 관리 구간을 찾을 수 없어 App/main 파일을 안전하게 수정할 수 없어요.",
    );
  }

  return (
    content.slice(0, currentStart) +
    nextContent.slice(nextStart, nextEnd + markers.end.length) +
    content.slice(currentEnd + markers.end.length)
  );
}

export function updateManagedSampleShell(
  currentContent: string,
  nextContent: string,
  buttonMarkers: SampleShellMarkerPair,
): string {
  return [SAMPLE_IMPORT_MARKERS, SAMPLE_ROUTE_MARKERS, buttonMarkers].reduce(
    (content, markers) => replaceMarkedBlock(content, nextContent, markers),
    currentContent,
  );
}
