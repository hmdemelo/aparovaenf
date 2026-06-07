-- Align billing defaults and lookup paths with the active Stripe integration.

alter table subscriptions
  alter column provider set default 'stripe';

alter table payment_events
  alter column provider set default 'stripe';

-- Stripe events were previously written with the legacy provider constant.
-- Limit the repair to unmistakable Stripe event names to preserve real history.
update payment_events
set provider = 'stripe'
where provider = 'abacate_pay'
  and event_type in (
    'checkout.session.completed',
    'invoice.paid',
    'invoice.payment_failed',
    'customer.subscription.deleted'
  )
  and not exists (
    select 1
    from payment_events stripe_event
    where stripe_event.provider = 'stripe'
      and stripe_event.provider_event_id = payment_events.provider_event_id
  );

create index if not exists idx_subscriptions_provider_subscription
  on subscriptions (provider, provider_subscription_id)
  where provider_subscription_id is not null;
