import type { FC } from '@/velocity';

type LoadingProps = {
    label?: string;
};

export const Loading: FC<LoadingProps> = (props) => (
    <div class="card loading-card" aria-live="polite" aria-busy="true">
        <div class="row gap loading-row">
            <span class="loading-spinner" aria-hidden="true" />
            <span class="muted">{props.label ?? 'Loading…'}</span>
        </div>
    </div>
);
