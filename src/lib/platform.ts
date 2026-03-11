import { Capacitor } from '@capacitor/core';

/** 네이티브 앱(Android/iOS)에서 실행 중인지 확인 */
export const isNativeApp = () => Capacitor.isNativePlatform();

/** 현재 플랫폼 반환: 'ios' | 'android' | 'web' */
export const getPlatform = () => Capacitor.getPlatform();

/** Android 앱에서 실행 중인지 확인 */
export const isAndroid = () => Capacitor.getPlatform() === 'android';

/** iOS 앱에서 실행 중인지 확인 */
export const isIOS = () => Capacitor.getPlatform() === 'ios';
