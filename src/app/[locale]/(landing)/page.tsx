import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getThemePage } from '@/core/theme';
import { DynamicPage } from '@/shared/types/blocks/landing';
import { getCurrentSubscription } from '@/shared/models/subscription';
import { getUserInfo } from '@/shared/models/user';

export const revalidate = 3600;

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('pages.index');
  const pricingT = await getTranslations('pages.pricing');

  // get current subscription for pricing section
  let currentSubscription;
  try {
    const user = await getUserInfo();
    if (user) {
      currentSubscription = await getCurrentSubscription(user.id);
    }
  } catch (error) {
    console.log('getting current subscription failed:', error);
  }

  // get page data
  const page: DynamicPage = t.raw('page');
  
  // merge pricing data if pricing section exists
  if (page.sections?.pricing) {
    page.sections.pricing = {
      ...page.sections.pricing,
      ...pricingT.raw('page.sections.pricing'),
      data: {
        currentSubscription,
      },
    };
  }

  // load page component
  const Page = await getThemePage('dynamic-page');

  return <Page locale={locale} page={page} />;
}
