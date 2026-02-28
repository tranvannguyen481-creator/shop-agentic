export interface EventCheckoutLineItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  basePrice: number;
  selectedChoices: string[];
}

export interface EventCheckoutPageViewModel {
  eventId: string;
  items: EventCheckoutLineItem[];
  itemCount: number;
  subtotalText: string;
  hasItems: boolean;
  infoMessage: string | null;
  onBackToDetail: () => void;
  onPlaceOrder: () => void;
}
