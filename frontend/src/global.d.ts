interface USBDevice {
  open(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  transferOut(endpointNumber: number, data: BufferSource): Promise<void>;
}

interface Navigator {
  usb: {
    requestDevice(options: { filters: { vendorId: number }[] }): Promise<USBDevice>;
  };
}
