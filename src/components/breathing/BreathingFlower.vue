<template>
  <div class="breathing-guide">
    <div class="breathing-flower" :class="breathingPhase">
      <!-- 花瓣层 -->
      <div class="petals">
        <div class="petal" v-for="n in 8" :key="n" :style="{ '--delay': `${n * 0.1}s` }"></div>
      </div>
      
      <!-- 中心圆 -->
      <div class="flower-center">
        <div class="instruction">{{ getBreathingInstruction }}</div>
        <div class="timer">{{ breathingCountdown }}s</div>
      </div>

      <!-- 光晕效果 -->
      <div class="glow-rings">
        <div class="ring" v-for="i in 3" :key="i"></div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.breathing-guide {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  perspective: 1000px;
}

.breathing-flower {
  position: relative;
  width: 300px;
  height: 300px;
  transform-style: preserve-3d;
  transition: transform 0.5s ease-out;

  &.inhale {
    .petals .petal {
      transform: rotate(var(--rotate)) translateY(-20px) scale(1.2);
      opacity: 0.9;
    }
    .glow-rings .ring {
      transform: scale(1.2);
      opacity: 0.6;
    }
  }

  &.hold {
    .petals .petal {
      transform: rotate(var(--rotate)) translateY(-20px) scale(1.2);
      opacity: 0.8;
    }
    .glow-rings .ring {
      transform: scale(1.1);
      opacity: 0.5;
    }
  }

  &.exhale {
    .petals .petal {
      transform: rotate(var(--rotate)) translateY(0) scale(1);
      opacity: 0.6;
    }
    .glow-rings .ring {
      transform: scale(1);
      opacity: 0.3;
    }
  }
}

.petals {
  position: absolute;
  width: 100%;
  height: 100%;
  
  .petal {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 80px;
    height: 120px;
    margin: -60px -40px;
    background: linear-gradient(135deg, #64B5F6, #2196F3);
    border-radius: 50% 50% 0 50%;
    transform-origin: 50% 100%;
    opacity: 0.7;
    transition: all 1.5s cubic-bezier(0.4, 0, 0.2, 1);

    @for $i from 1 through 8 {
      &:nth-child(#{$i}) {
        --rotate: #{$i * 45}deg;
        transform: rotate(var(--rotate)) translateY(0);
        transition-delay: var(--delay);
      }
    }
  }
}

.flower-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100px;
  height: 100px;
  background: white;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px rgba(0,0,0,0.1);
  z-index: 2;

  .instruction {
    font-size: 16px;
    color: #333;
    margin-bottom: 4px;
  }

  .timer {
    font-size: 24px;
    font-weight: bold;
    color: #2196F3;
  }
}

.glow-rings {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  
  .ring {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border: 2px solid rgba(33, 150, 243, 0.2);
    border-radius: 50%;
    animation: pulse 4s infinite;
    transition: all 1.5s cubic-bezier(0.4, 0, 0.2, 1);

    @for $i from 1 through 3 {
      &:nth-child(#{$i}) {
        animation-delay: #{$i * 0.5}s;
      }
    }
  }
}

@keyframes pulse {
  0% {
    transform: scale(0.95);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
  100% {
    transform: scale(0.95);
    opacity: 0.5;
  }
}

// 呼吸状态的颜色变化
.breathing-flower {
  &.inhale {
    .petal {
      background: linear-gradient(135deg, #81D4FA, #29B6F6);
    }
  }
  
  &.hold {
    .petal {
      background: linear-gradient(135deg, #90CAF9, #42A5F5);
    }
  }
  
  &.exhale {
    .petal {
      background: linear-gradient(135deg, #64B5F6, #2196F3);
    }
  }
}

// 响应式调整
@media (max-width: 768px) {
  .breathing-flower {
    width: 250px;
    height: 250px;
    
    .petal {
      width: 60px;
      height: 90px;
      margin: -45px -30px;
    }
    
    .flower-center {
      width: 80px;
      height: 80px;
      
      .instruction {
        font-size: 14px;
      }
      
      .timer {
        font-size: 20px;
      }
    }
  }
}
</style>

<script setup lang="ts">
import { computed } from 'vue';

// 定义props
defineProps<{
  breathingPhase: string;
  breathingCountdown: number;
}>();

const getBreathingInstruction = computed(() => {
  switch(breathingPhase.value) {
    case 'inhale': return '吸气';
    case 'hold': return '屏息';
    case 'exhale': return '呼气';
    default: return '准备';
  }
});
</script>