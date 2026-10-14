export function normalizeSearchText(value) {
  return value
    .toLowerCase()
    .replace(/daal|dahl/g, 'dal')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function doesMatchSearch(query, values) {
  const haystack = values
    .flatMap(value => (Array.isArray(value) ? value : [value]))
    .filter(Boolean)
    .map(value => normalizeSearchText(String(value)))
    .join(' ');
  return haystack.includes(query);
}

export function getHomeSearchResults(homeData, query, actions) {
  const mealResults = [
    homeData.meals.today
      ? {
          key: 'today-meal',
          icon: homeData.meals.today.icon,
          title: homeData.meals.today.title,
          meta: [homeData.meals.today.meta, homeData.meals.today.chef]
            .filter(Boolean)
            .join(' · '),
          type: "Today's Meal",
          onPress: actions.onTrack,
        }
      : null,
    homeData.meals.next
      ? {
          key: 'next-meal',
          icon: homeData.meals.next.icon,
          title: homeData.meals.next.title,
          meta: homeData.meals.next.meta,
          type: 'Next Meal',
        }
      : null,
    homeData.meals.tomorrow
      ? {
          key: 'tomorrow-meal',
          icon: homeData.meals.tomorrow.icon,
          title: homeData.meals.tomorrow.title,
          meta: homeData.meals.tomorrow.meta,
          type: "Tomorrow's Meal",
          onPress: actions.onCalendar,
        }
      : null,
  ]
    .filter(Boolean)
    .filter(result =>
      doesMatchSearch(query, [result.title, result.meta, result.type]),
    );
  const chefResults = (homeData.nearbyChefs || [])
    .filter(chef =>
      doesMatchSearch(query, [
        chef.name,
        chef.owner,
        chef.badge,
        chef.cuisine,
        chef.tags,
        chef.price,
        chef.time,
      ]),
    )
    .map(chef => ({
      key: `chef-${chef.name}`,
      icon: chef.image,
      title: chef.name,
      meta: [chef.owner, chef.cuisine, chef.price, chef.time]
        .filter(Boolean)
        .join(' · '),
      type: 'HomeChef',
      onPress: actions.onHomeChef,
    }));
  const productResults = (homeData.products || [])
    .filter(product =>
      doesMatchSearch(query, [
        product.name,
        product.category,
        product.description,
        product.mealType,
        product.tags,
        product.price,
      ]),
    )
    .map(product => ({
      key: `product-${product.name}`,
      icon: product.image,
      title: product.name,
      meta: [product.category, product.mealType, product.price]
        .filter(Boolean)
        .join(' · '),
      type: 'Tiffin',
    }));
  return [...mealResults, ...productResults, ...chefResults];
}

export function getTrackingOrder(homeData) {
  if (homeData.activeOrder) {
    return homeData.activeOrder;
  }
  if (!homeData.meals.today) {
    return null;
  }
  const chefParts = String(homeData.meals.today.chef || '')
    .split('·')
    .map(part => part.trim());
  return {
    _id: 'today-meal-preview',
    orderId: 'TODAY-MEAL',
    customer: homeData.customer?.name || '',
    meal: homeData.meals.today.title,
    chef: chefParts[1] || chefParts[0] || '',
    status: normalizeTrackingStatus(homeData.meals.today.status),
    amount: '',
    eta: extractEta(homeData.meals.today.meta),
    address:
      homeData.customer?.liveAddress ||
      homeData.customer?.address ||
      homeData.customer?.location ||
      '',
    items: [homeData.meals.today.title],
    orderType: 'subscription',
    paymentMethod: 'UPI',
    paymentProvider: '',
    paymentId: '',
    paymentStatus: '',
    source: 'middo-home-today-meal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function normalizeTrackingStatus(status) {
  const value = String(status || '').toLowerCase();
  if (value.includes('delivered')) {
    return 'Delivered';
  }
  if (value.includes('out') || value.includes('way')) {
    return 'Out For Delivery';
  }
  if (value.includes('ready')) {
    return 'Ready';
  }
  if (value.includes('preparing')) {
    return 'Preparing';
  }
  return 'Order Confirmed';
}

function extractEta(meta) {
  const value = String(meta || '');
  const arrival = value.match(/(?:by|eta)\s+([^·]+)/i);
  return arrival?.[1]?.trim() || '30 min';
}
