import { onMounted, onUnmounted, readonly, shallowRef } from "vue";

export function useDevicePixelRatio() {
  const isSupported =
    typeof window !== "undefined" &&
    "matchMedia" in window &&
    typeof window.matchMedia === "function";

  const pixelRatio = shallowRef(
    typeof window !== "undefined" && "devicePixelRatio" in window
      ? window.devicePixelRatio
      : 1
  );

  function handler() {
    pixelRatio.value = window.devicePixelRatio;
  }

  let mediaQueryList: MediaQueryList | null = null;

  onMounted(() => {
    if (!isSupported) return;
    mediaQueryList = window.matchMedia(`(resolution: ${pixelRatio.value}dppx)`);
    mediaQueryList?.addEventListener('change', handler, { passive: true });
  });

  onUnmounted(() => {
    if (!isSupported) return;
    if (mediaQueryList) {
      mediaQueryList.removeEventListener('change', handler);
      mediaQueryList = null;
    }
  })

  return {
    pixelRatio: readonly(pixelRatio),
  };
}
