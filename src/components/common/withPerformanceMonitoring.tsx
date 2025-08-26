import { log } from '@utils/logger';
import { useEffect, type ComponentType } from 'react';

interface PerformanceMonitoringProps {
  componentName?: string;
}

function withPerformanceMonitoring<P extends object>(
  WrappedComponent: ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const WithPerformanceMonitoring = (props: P & PerformanceMonitoringProps) => {
    useEffect(() => {
      log.performance.start(`${displayName} mount`);
      log.ui.componentMount(displayName, props);

      return () => {
        log.performance.end(`${displayName} mount`);
        log.ui.componentUnmount(displayName);
      };
    }, [props]);

    return <WrappedComponent {...props} />;
  };

  WithPerformanceMonitoring.displayName = `withPerformanceMonitoring(${displayName})`;

  return WithPerformanceMonitoring;
}

export default withPerformanceMonitoring;
