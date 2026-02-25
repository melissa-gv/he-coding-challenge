import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { PowerDataPoint } from '../../shared/models/power-history.models';
import { AssetStoreService } from '../../shared/store/asset-store.service';
import { PowerStoreService } from '../../shared/store/power-store.service';
import type { ChartData, ChartDataset, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-power-visualization',
  imports: [CommonModule, FormsModule, ButtonModule, ChartModule, MessageModule, SelectModule],
  templateUrl: './power-visualization.component.html',
  styleUrl: './power-visualization.component.scss'
})
export class PowerVisualizationComponent {
  private readonly assetStore = inject(AssetStoreService);
  private readonly powerStore = inject(PowerStoreService);

  protected readonly assets = this.assetStore.assets;
  protected readonly isLoadingAssets = this.assetStore.isLoadingAssets;
  protected readonly assetsError = this.assetStore.assetsError;
  protected readonly selectedPowerAssetId = this.powerStore.selectedPowerAssetId;
  protected readonly isLoadingPower = this.powerStore.isLoadingPower;
  protected readonly powerError = this.powerStore.powerError;
  protected readonly selectedPowerData = this.powerStore.selectedPowerData;
  protected readonly selectedPowerAsset = computed(() => {
    const assetId = this.selectedPowerAssetId();
    return this.assets().find((asset) => asset.id === assetId) ?? null;
  });
  protected readonly hasPowerData = computed(
    () => !!this.selectedPowerData()?.history.length || !!this.selectedPowerData()?.forecast.length
  );
  protected readonly powerChartData = computed<ChartData<'line'>>(() => {
    const powerData = this.selectedPowerData();

    if (!powerData) {
      return { labels: [], datasets: [] };
    }

    const allPoints = [...powerData.history, ...powerData.forecast];
    const historyCount = powerData.history.length;

    return {
      labels: allPoints.map((point) => this.toChartLabel(point)),
      datasets: [
        this.createLineDataset(
          'Power (Actual)',
          allPoints.map((point, index) => (index < historyCount ? point.power_kw : null)),
          '#34e6b2',
          'yPower'
        ),
        this.createLineDataset(
          'Power (Forecast)',
          allPoints.map((point, index) => (index >= historyCount ? point.power_kw : null)),
          '#34e6b2',
          'yPower',
          [6, 4]
        ),
        this.createLineDataset(
          'Efficiency (Actual)',
          allPoints.map((point, index) => (index < historyCount ? point.efficiency : null)),
          '#6ba8ff',
          'yEfficiency'
        ),
        this.createLineDataset(
          'Efficiency (Forecast)',
          allPoints.map((point, index) => (index >= historyCount ? point.efficiency : null)),
          '#6ba8ff',
          'yEfficiency',
          [6, 4]
        )
      ]
    };
  });
  protected readonly powerChartOptions = computed<ChartOptions<'line'>>(() => {
    const powerData = this.selectedPowerData();
    const powerValues = powerData ? [...powerData.history, ...powerData.forecast].map((point) => point.power_kw) : [];
    const minPower = powerValues.length ? Math.min(...powerValues) : 0;
    const maxPower = powerValues.length ? Math.max(...powerValues) : 0;

    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          labels: {
            color: '#aac1dd'
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const rawValue = context.parsed.y;

              if (context.dataset.yAxisID === 'yEfficiency') {
                return `${context.dataset.label}: ${rawValue}%`;
              }

              return `${context.dataset.label}: ${rawValue} kW`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#8ea9c8',
            maxTicksLimit: 12
          },
          grid: {
            color: 'rgba(37, 55, 85, 0.35)'
          }
        },
        yPower: {
          type: 'linear',
          position: 'left',
          suggestedMin: Math.min(minPower - 5, 0),
          suggestedMax: Math.max(maxPower + 5, 0),
          ticks: {
            color: '#8ea9c8',
            callback: (tickValue) => `${tickValue} kW`
          },
          title: {
            display: true,
            text: 'Power (+ consume / - generate)',
            color: '#aac1dd'
          },
          grid: {
            color: 'rgba(37, 55, 85, 0.35)'
          }
        },
        yEfficiency: {
          type: 'linear',
          position: 'right',
          min: 0,
          max: 100,
          ticks: {
            color: '#8ea9c8',
            callback: (tickValue) => `${tickValue}%`
          },
          title: {
            display: true,
            text: 'Efficiency (%)',
            color: '#aac1dd'
          },
          grid: {
            drawOnChartArea: false
          }
        }
      }
    };
  });

  constructor() {
    effect(() => {
      this.powerStore.refreshPowerData(this.selectedPowerAssetId());
    });
  }

  protected onSelectedPowerAssetChange(assetId: string | null): void {
    this.powerStore.setSelectedPowerAssetId(assetId);
  }

  protected refreshPowerData(): void {
    this.powerStore.refreshPowerData(this.selectedPowerAssetId());
  }

  private createLineDataset(
    label: string,
    data: Array<number | null>,
    color: string,
    yAxisID: 'yPower' | 'yEfficiency',
    borderDash: number[] = []
  ): ChartDataset<'line', Array<number | null>> {
    return {
      label,
      data,
      yAxisID,
      borderColor: color,
      backgroundColor: color,
      borderDash,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
      tension: 0.25
    };
  }

  private toChartLabel(point: PowerDataPoint): string {
    return new Date(point.timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  }
}
