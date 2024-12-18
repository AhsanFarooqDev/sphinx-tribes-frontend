import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStores } from 'store';
import { EuiGlobalToastList } from '@elastic/eui';
import { phaseTicketStore } from '../../../store/phase';
import { ActionButton, TicketButtonGroup } from '../../../people/widgetViews/workspace/style';
import {
  TicketContainer,
  TicketHeader,
  TicketTextArea,
  TicketInput,
  TicketHeaderInputWrap
} from '../../../pages/tickets/style';
import { TicketStatus, Ticket } from '../../../store/interface';
import { Toast } from '../../../people/widgetViews/workspace/interface';

interface TicketEditorProps {
  ticketData: Ticket;
  websocketSessionId: string;
}

const TicketEditor = observer(({ ticketData, websocketSessionId }: TicketEditorProps) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { main } = useStores();
  const currentTicket = phaseTicketStore.getTicket(ticketData.uuid);
  const name = currentTicket?.name || 'Ticket';
  const description = currentTicket?.description || '';

  const addUpdateSuccessToast = () => {
    setToasts([
      {
        id: `${Date.now()}-success`,
        title: 'Hive',
        color: 'success',
        text: 'Updates Saved!'
      }
    ]);
  };

  const addUpdateErrorToast = () => {
    setToasts([
      {
        id: `${Date.now()}-error`,
        title: 'Hive',
        color: 'danger',
        text: 'We had an issue, try again!'
      }
    ]);
  };

  const handleUpdate = async () => {
    try {
      const ticketPayload = {
        metadata: {
          source: 'websocket',
          id: websocketSessionId
        },
        ticket: {
          ...ticketData,
          name,
          description,
          status: 'DRAFT' as TicketStatus,
          version: ticketData.version + 1
        }
      };

      const response = await main.createUpdateTicket(ticketPayload);

      if (response === 406 || !response) {
        throw new Error('Failed to update ticket');
      }

      phaseTicketStore.updateTicket(ticketData.uuid, ticketPayload.ticket);
      addUpdateSuccessToast();
    } catch (error) {
      console.error('Error updating ticket:', error);
      addUpdateErrorToast();
    }
  };

  const addSuccessToast = () => {
    setToasts([
      {
        id: `${Date.now()}-ticket-success`,
        title: 'Ticket Builder',
        color: 'success',
        text: "Success, I'll rewrite your ticket now!"
      }
    ]);
  };

  const addErrorToast = () => {
    setToasts([
      {
        id: `${Date.now()}-ticket-error`,
        title: 'Ticket Builder',
        color: 'danger',
        text: 'Sorry, there appears to be a problem'
      }
    ]);
  };

  const handleTicketBuilder = async () => {
    try {
      const ticketPayload = {
        metadata: {
          source: 'websocket',
          id: websocketSessionId
        },
        ticket: {
          ...ticketData,
          name,
          description,
          status: 'DRAFT' as TicketStatus
        }
      };

      const response = await main.sendTicketForReview(ticketPayload);

      if (response) {
        addSuccessToast();
      } else {
        throw new Error('Failed to send ticket for review');
      }
    } catch (error) {
      console.error('Error in ticket builder:', error);
      addErrorToast();
    }
  };

  return (
    <TicketContainer>
      <TicketHeaderInputWrap>
        <TicketHeader>Ticket:</TicketHeader>
        <TicketInput
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            phaseTicketStore.updateTicket(ticketData.uuid, { name: e.target.value })
          }
          placeholder="Enter ticket name..."
        />
      </TicketHeaderInputWrap>
      <TicketTextArea
        value={description}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
          phaseTicketStore.updateTicket(ticketData.uuid, { description: e.target.value })
        }
        placeholder="Enter ticket details..."
      />
      <TicketButtonGroup>
        <ActionButton color="primary" onClick={handleUpdate} data-testid="story-input-update-btn">
          Update
        </ActionButton>
        <ActionButton
          color="#49C998"
          onClick={handleTicketBuilder}
          data-testid="story-generate-btn"
        >
          Ticket Builder
        </ActionButton>
      </TicketButtonGroup>
      <EuiGlobalToastList
        toasts={toasts}
        dismissToast={() => setToasts([])}
        toastLifeTimeMs={3000}
      />
    </TicketContainer>
  );
});

export default TicketEditor;
