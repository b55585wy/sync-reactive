<template>
  <transition name="modal">
    <div v-if="modelValue" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-container" @click.stop>
        <div class="modal-content">
          <slot></slot>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'ModalDialog',
  
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    closeOnOverlay: {
      type: Boolean,
      default: true
    }
  },
  
  emits: ['update:modelValue'],
  
  setup(props, { emit }) {
    const handleOverlayClick = () => {
      if (props.closeOnOverlay) {
        emit('update:modelValue', false)
      }
    }
    
    return {
      handleOverlayClick
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background-color: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-content {
  position: relative;
}

/* 动画效果 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9);
}
</style> 